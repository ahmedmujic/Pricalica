using System.Text.Json.Serialization;

namespace Pricalica.Models
{
    public record CreateMessageDto
    {
        [JsonPropertyName("message")]
        public string Message { get; set; }
        [JsonPropertyName("username")]
        public string Username { get; set; }
    }

    public record SendMessageDto : CreateMessageDto
    {
        public SendMessageDto(CreateMessageDto message): base(message)
        {
        }

        public DateTime DateTime => DateTime.Now;
    }
}
