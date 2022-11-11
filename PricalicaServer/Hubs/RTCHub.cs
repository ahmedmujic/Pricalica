using Microsoft.AspNetCore.SignalR;
using Pricalica.Models;
using System.Text.Json;

namespace Pricalica.Hubs
{
    public class RTCHub : Hub
    {
        public static Dictionary<string, List<UserInfoDto>> Rooms = new();

        public override async Task OnConnectedAsync()
        {
            var httpContext = Context.GetHttpContext();
            var roomId = httpContext?.Request.Query["roomId"].ToString();
            var username = httpContext?.Request.Query["username"].ToString();
            var peerId = httpContext?.Request.Query["peerId"].ToString();
            if (string.IsNullOrEmpty(peerId))
            {
                peerId = Rooms["roomId"].Select(r => r.PeerId).FirstOrDefault();
            }
            var userInfo = new UserInfoDto { ConnectionId = Context.ConnectionId, Username = username, PeerId = peerId };
            
            if(roomId == null)
            {
                throw new Exception("Room id is not sent");
            }

            if (!Rooms.TryGetValue(roomId, out var user))
            {
                Rooms.Add(roomId, new List<UserInfoDto>() { userInfo });
            }
            else
            {
                user.Add(userInfo);
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);

            await Clients.Group(roomId).SendAsync("UserOnlineInGroup", Rooms[roomId].ToList());
        }

        public async Task GetOtherUsersInRoom()
        {
            var roomId = Rooms.Where(r => r.Value.FirstOrDefault(u => u.ConnectionId == Context.ConnectionId) != null).FirstOrDefault().Key;
            await Clients.Caller.SendAsync("UsersInGroup", Rooms[roomId].ToList());
        }

        public async Task SendMessage(CreateMessageDto messageDto)
        {
            var roomId = Rooms.Where(r => r.Value.FirstOrDefault(u => u.ConnectionId == Context.ConnectionId) != null).FirstOrDefault().Key;

            await Clients.Group(roomId).SendAsync("NewMessage", new SendMessageDto(messageDto));
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            var disconnectedUser = Rooms.Where(r => r.Value.FirstOrDefault(u => u.ConnectionId == Context.ConnectionId) != null).FirstOrDefault().Key;
            Rooms.Remove(disconnectedUser);
            await Clients.All.SendAsync("UserDisconnect", Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
        }
    }
}
