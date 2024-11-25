

(function($) {

	"use strict";

	var fullHeight = function() {

		$('.js-fullheight').css('height', $(window).height());
		$(window).resize(function(){
			$('.js-fullheight').css('height', $(window).height());
		});

	};
	fullHeight();

	$('#sidebarCollapse').on('click', function () {
      $('#sidebar').toggleClass('active');
  });

})(jQuery);

function getCookie(name) {
	let matches = document.cookie.match(new RegExp(
		"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
	));
	return matches ? decodeURIComponent(matches[1]) : undefined;
}

var userData=JSON.parse(getCookie('user'));

var sender_id = userData._id;
let reciever_id;
var globalGroupId;

var socket = io('/user-namespace', {
	auth: { token: userData._id }
});

$(document).ready(function() {
	$('.user-list').click(function() {
		reciever_id = $(this).data('id');
		$('.start-head').hide();
		$('.chat-section').show();
		$('#chat-container').html("");

		socket.emit('existingChat', { reciever_id, sender_id });
	});
});

$('#chat-form').submit(function(event) {
	event.preventDefault();
	var message = $('#message').val();

	$.ajax({
		url: "/savechat",
		type: 'POST',
		data: { sender_id, reciever_id, message },
		success: function(data) {
			if (data.success) {
				$('#message').val("");
				var chat = data.message.message;
				var html = `<div class="current-user-chat" id="${data.message._id}">
								<h5><span>${chat}</span>
									<i class="fa fa-trash" aria-hidden="true" data-id="${data.message._id}" data-msg="${chat}" data-toggle="modal" data-target="#deleteChatModel"></i>
									<i class="fa fa-edit" aria-hidden="true" data-id="${data.message._id}" data-msg="${chat}" data-toggle="modal" data-target="#updateChatModel"></i>
								</h5>
							</div>`;
				$('#chat-container').append(html);
				socket.emit("newChat", data.message);
			} else {
				alert(data.message);
			}
		},
		error: function(err) {
			console.error("Error saving chat:", err);
			alert("Failed to send message.");
		}
	});
});

socket.on('loadNewChat', function(data) {
	console.log("hy i am working")
	console.log(sender_id === data.reciever_id && reciever_id === data.sender_id)
	if (sender_id === data.reciever_id && reciever_id === data.sender_id) {
		console.log("i am working also",data._id)
		var html = `<div class="distance-user-chat" id="${data._id}"><h1>${data.message}</h1></div>`;
$('#chat-container').append(html);

		console.log("successfully")
	}
});

socket.on('allChats', function(chats) {
	$('#chat-container').html("");
	let html = '';
	chats.forEach(chat => {
		var addClass = chat.sender_id === sender_id ? "current-user-chat" : "distance-user-chat";
		html += `<div class="${addClass}" id="${chat._id}">
					<h5><span>${chat.message}</span>`;
		if (chat.sender_id === sender_id) {
			html += `<i class="fa fa-trash" aria-hidden="true" data-id="${chat._id}" data-msg="${chat.message}" data-toggle="modal" data-target="#deleteChatModel"></i>
					 <i class="fa fa-edit" aria-hidden="true" data-id="${chat._id}" data-msg="${chat.message}" data-toggle="modal" data-target="#updateChatModel"></i>`;
		}
		html += `</h5></div>`;
	});
	$('#chat-container').append(html);
});

// Delete Chat Functionality
$(document).on('click', '.fa-trash', function() {
	$('#delete-message-id').val($(this).data('id'));
	$('#delete-message').text($(this).data('msg'));
});

$('#delete-chat-form').submit(function(event) {
	event.preventDefault();
	var id = $('#delete-message-id').val();
	$.ajax({
		url: "/deletechat",
		type: 'POST',
		data: { _id: id },
		success: function(data) {
			if (data.success) {
				$(`#${id}`).remove();
				$('#deleteChatModel').modal('hide');
				socket.emit('chatRemoved', id);
			} else {
				alert(data.message);
			}
		},
		error: function(err) {
			console.error("Error deleting message:", err);
			alert("Failed to delete message.");
		}
	});
});

socket.on('chatMessageDeleted', function(id) {
	$(`#${id}`).remove();
});

// Update Chat Functionality
$(document).on('click', '.fa-edit', function() {
	$('#update-message-id').val($(this).data('id'));
	$('#update-message').val($(this).data('msg'));
});

$('#update-chat-form').submit(function(event) {
event.preventDefault();
var id = $('#update-message-id').val();
console.log("id", id);
var message = $('#update-message').val();
console.log("message",message);
$.ajax({
	url: "/updatechat",
	type: 'POST',
	data: { _id: id, message: message },
	success: function(data) {
		if (data.success==true) {
			// Update message in UI and hide modal instantly
			$(`#${id}`).find('span').text(message);
			$(`#${id}`).find('.fa-edit').attr('data-msg', message);
			$('#updateChatModel').modal('hide');
			
			// Emit socket event for real-time update
			socket.emit('chatUpdated', { id: id, message: message });
		} else {
			alert(data.message);
		}
	},
	error: function(err) {
		console.error("Error updating message:", err);
		alert("Failed to update message.");
	}
});
});

socket.on('chatMessageUpdated', function(data) {
$(`#${data.id}`).find('span').text(data.message);
});

$('.addmember').click(function(){
	var  limit=$(this).attr('data-limit')
	var id=$(this).attr('data-id')
	$('#group_id').val(id);
	$('#limit').val(limit)
	

	$.ajax({
		url: "/getMembers",
		type: 'POST',
		data: { group_id: id},
		success: function(data) {
			console.log("data",data)
			if (data.success==true) {
				let users=data.users;
				let html = ""; // Initialize here
					for (let i = 0; i < users.length; i++) {
					let isMemberOfGroup = users[i]['members'].length > 0 ? true: false;
					console.log(users[i]," + ",isMemberOfGroup)
					html += `<tr>
						<td>
						<input type="checkbox" 	`+(isMemberOfGroup ? "checked":"")+` name="members[]" value="${users[i]['_id']}"/>
						</td>
						<td>
						${users[i]['name']}
						</td>
					</tr>`;
					}

				$('.addMemberInTable').append(html);
				
			}else{
				alert(data.message)
			}
		},
		error: function(err) {
			console.error(err);
			alert(err);
		}
	});

	
})

$('#add-member-form').submit(function(event){
	event.preventDefault();

	var formData=$(this).serialize();
	$.ajax({
		url:"/addMembers",
		type:"POST",
		data:formData,
		success:function(res){
          if(res.success==true){
			$('#memberModel').modal('hide');
			$('#add-member-form')[0].reset();
			$('#addMemberError').text("");
			alert(res.msg)
			location.reload();
		  }else{
			$('#addMemberError').text(res.msg)
		  }
		}

	})
})

$(".updateMember").click(function(){
	var groupdata=JSON.parse($(this).attr('data-obj'));

	$('#lastLimited').val(groupdata.limit);
	$('#updategroupId').val(groupdata._id);
	$('#memberName').val(groupdata.name);
	$('#memberLimit').val(groupdata.limit);
})

$("#updateChatGroupForm").submit(function(event){
	 event.preventDefault()


	  $.ajax({
		url:"/updateGroup",
		type:"POST",
		data:new FormData(this),
		contentType:false,
		cache:false,
		processData:false,
		success:function(res){
			alert(res.msg)
			if(res.success){
				location.reload();
			}
		}


	  })
})

$('.deleteGroup').click(function(){
	var deleteGroupId=$(this).attr('data-id');
	var deleGroupName=$(this).attr('data-name')
	$('#deletedgroupId').val(deleteGroupId);
	$('#delete-Group-Name').text(deleGroupName);
})

$('#deleteChatGroupForm').submit(function(event){
	event.preventDefault();
	var form=$(this).serialize();
	$.ajax({
		url:"/deleteGroup",
		type:"POST",
		data:form,
		success:function(res){
			alert(res.msg)
			if(res.success){
				location.reload();
			}else{
				alert(res.msg)
			}
		}
	})
})
$('.copy').click(function(){
	$(this).prepend('<span class="copied_text">Copied </span>')
	var groupId=$(this).attr('data-id');
	var url=window.location.host+'/share-group/'+ groupId;

	var temp=$("<input>")
	$("body").append(temp);
    temp.val(url).select();
	document.execCommand('copy');


	temp.remove();

	setTimeout(()=>{
		$('.copied_text').remove();
	},2000); 
})
$('.join-group').click(function(){
	$(this).text("wait.....")
	

    $(this).attr("disabled","disabled")
	var groupId=$(this).attr('data-id');
	$.ajax({
		url:"/joinGroup",
		type:"POST",
		data:{id:groupId},
		success:function(res){
			alert(res.message)
			if(res.success){
				location.reload();
			}else{
				alert(res.msg)
	           $(this).text("Join");
			   $(this).removeAttr("disabled","disabled")

			}
		}
	})
})

//group chatting script

$('.group-list').click(function(){
	$('.group-start-head').hide();
	$('.group-chat-section').show();

	globalGroupId=$(this).attr('data-id');
	loadGroupChats();

})

$('#group-chat-form').submit(function(event) {
	event.preventDefault();
	var message = $('#group-message').val();

	$.ajax({
		url: "/savegroupchat",
		type: 'POST',
		data: { sender_id:sender_id,groupId:globalGroupId,message:message},
		success: function(data) {
			if (data.success) {

			$('#group-message').val("");
				var chat = data.chat.message;
				var html = `<div class="current-user-chat" id="${data.chat._id}">
								<h5><span>${chat}</span>
									<i class="fa fa-trash" aria-hidden="true" data-id="${data.chat._id}" data-msg="${chat}" data-toggle="modal" data-target="#deleteGroupChatModel"></i>
									<i class="fa fa-edit" aria-hidden="true" data-id="${data.chat._id}" data-msg="${chat}" data-toggle="modal" data-target="#groupUpdateChatModel"></i>
                                </h5>`
								
							var date=new Date(data.chat.createdAt)
							let currentDate=date.getDate();
							let currentMonth=(date.getMonth()+1)>0?(date.getMonth()+1):'0'+(date.getMonth()+1);
							let currentYear=date.getFullYear();
							let fullDate=currentDate+" : "+currentMonth+" : "+currentYear
							
							
						html+=`
								 <div class="user-data"><b> Me </b>   ` + fullDate + `</div>;

							</div>`;
				$('#group-chat-container').append(html);
				socket.emit("groupNewChat", data.chat);
		} else {
		 		alert(data.msg);
		}
		},
		error: function(err) {
			console.error("Error saving chat:", err);
			alert("Failed to send message.");
		}
	});
});

socket.on('groupChatRecieved', function(data) {
	var html = `<div class="distance-user-chat" id="${data._id}">
								<h5><span>${data.message}</span>
									<i class="fa fa-trash" aria-hidden="true" data-id="${data._id}" data-msg="${data.message}" data-toggle="modal" data-target="#deleteGroupChatModel"></i>
									<i class="fa fa-edit" aria-hidden="true" data-id="${data._id}" data-msg="${data.message}" data-toggle="modal" data-target="#groupUpdateChatModel"></i>
								</h5>`

								var date=new Date(data.createdAt)
							let currentDate=date.getDate();
							let currentMonth=(date.getMonth()+1)>0?(date.getMonth()+1):'0'+(date.getMonth()+1);
							let currentYear=date.getFullYear();
							let fullDate=currentDate+" : "+currentMonth+" : "+currentYear

						
			

							
                           html+=
							`<div class="user-data "><img src= "`   +data.sender_id.image+  `"  class="user-data-image"/>
								<b>${data.sender_id.name} </b>` + fullDate + `</div>
							
							</div>`;
				$('#group-chat-container').append(html);
				
	});


	function loadGroupChats()
	{
         $.ajax({
             url:"/load-group-chats",
			 type:"POST",
			 data:{groupId:globalGroupId},
			 success:function(res){
				if(res.success){
                      var chats=res.chats;
					  console.log("loadgroupChats: ",chats)
					var html=''
					
					for(let i=0;i<chats.length;i++){
						var className = "distance-user-chat"

						if(sender_id===chats[i].sender_id){
							className="current-user-chat"
						}


						 html = `<div class=${className} id="${chats[i]._id}">
								<h5><span>${chats[i].message}</span>`


								if(sender_id===chats[i].sender_id._id){
									html+= `<i class="fa fa-trash  deleteGroupChat" aria-hidden="true"  data-id="${chats[i]._id}" data-msg="${chats[i].message}" data-toggle="modal" data-target="#deleteGroupChatModel"></i>
									<i class="fa fa-edit updateGroupChat" aria-hidden="true" data-id="${chats[i]._id}" data-msg="${chats[i].message}" data-toggle="modal" data-target="#groupUpdateChatModel"></i>`
									
								}
								
							html+=`	</h5>`

							var date=new Date(chats[i].createdAt)
							let currentDate=date.getDate();
							let currentMonth=(date.getMonth()+1)>0?(date.getMonth()+1):'0'+(date.getMonth()+1);
							let currentYear=date.getFullYear();
							let fullDate=currentDate+" : "+currentMonth+" : "+currentYear
							if(sender_id===chats[i].sender_id._id){
								html+= `<div class="user-data"><b> Me </b>   ` + fullDate + `</div>`;
							}else{
								html+= `<div class="user-data "><img src= "`   +chats[i].sender_id.image+  `"  class="user-data-image"/>
								<b>${chats[i].sender_id.name} </b>` + fullDate + `</div>`;

							}


                            html+=`
							</div>`;
				             $('#group-chat-container').append(html);

						

					}
				}
				else{
					alert(res.msg);
				}
			 }
		 })
	}

	$(document).on('click','.deleteGroupChat',function(){
		var msg=$(this).parent().find('span').text();
		
		$('#delete-group-message').text(msg);
		$('#deleteGroup-message-id').val($(this).attr('data-id'))
	})
	$('#deleteGroup-chat-form').submit(function(e){
		e.preventDefault();
		var id=$('#deleteGroup-message-id').val()

		$.ajax({
			url:"/deleteGroupChat",
			type:"POST",
			data:{id:id},
			success:function(res){
              if(res.success){
                $("#"+id).remove()
				socket.emit("removeMessage",id);
				$("#deleteGroupChatModel").modal("hide");
			  }else{
				alert(res.msg)
			}
			}
		})
	})

	socket.on("chatGroupRemoved",function(_id){
		$("#"+_id).remove()
	})



	$(document).on('click', '.updateGroupChat', function() {
		$('#group-update-message-id').val($(this).data('id'));
		$('#group-update-message').val($(this).data('msg'));
	});
	
	$('#group-update-chat-form').submit(function(event) {
	event.preventDefault();
	var id = $('#group-update-message-id').val();
	var message = $('#group-update-message').val();
	$.ajax({
		url: "/updateGroupchat",
		type: 'POST',
		data: { _id: id, message: message },
		success: function(data) {
			if (data.success==true) {
				// Update message in UI and hide modal instantly
				$(`#${id}`).find('span').text(message);
				$(`#${id}`).find('.updateGroupChat').attr('data-msg', message);
				$('#groupUpdateChatModel').modal('hide');
				
				// Emit socket event for real-time update
				socket.emit('groupChatUpdated', { id: id, message: message });
			} else {
				alert(data.message);
			}
		},
		error: function(err) {
			console.error("Error updating message:", err);
			alert("Failed to update message.");
		}
	});
	});
	
	socket.on('chatUpdated', function(data) {
	$(`#${data.id}`).find('span').text(data.message);
	});
	




		


	