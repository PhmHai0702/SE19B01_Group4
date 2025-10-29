using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WebAPI.DTOs;
using WebAPI.Services;

namespace WebAPI.Controllers
{
    [ApiController]
    [Route("api/moderator")]
    public class ModeratorController : ControllerBase
    {
        private readonly IPostService _postService;
        private readonly IUserService _userService;
        private readonly ICommentService _commentService;

        public ModeratorController(IPostService postService, IUserService userService, ICommentService commentService)
        {
            _postService = postService;
            _userService = userService;
            _commentService = commentService;
        }

        private UserContextDTO? GetCurrentUser()
        {
            var uid = HttpContext.Session.GetInt32("UserId");
            if (uid != null)
            {
                var user = _userService.GetById(uid.Value);
                if (user != null)
                {
                    return new UserContextDTO { UserId = uid.Value, Role = user.Role };
                }
            }

            var claimId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (claimId == null) return null;

            if (int.TryParse(claimId, out int id))
            {
                var role = User.FindFirst(ClaimTypes.Role)?.Value;
                return new UserContextDTO { UserId = id, Role = role ?? "user" };
            }

            return null;
        }

        private bool IsModeratorOrAdmin()
        {
            var user = GetCurrentUser();
            return user != null && (user.Role == "moderator" || user.Role == "admin");
        }

        // GET /api/moderator/stats
        [HttpGet("stats")]
        public ActionResult<ModeratorStatsDTO> GetStats()
        {
            try
            {
                var stats = _postService.GetModeratorStats();
                return Ok(stats);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // GET /api/moderator/posts/pending
        [HttpGet("posts/pending")]
        public ActionResult<IEnumerable<PostDTO>> GetPendingPosts(
            [FromQuery] int page = 1,
            [FromQuery] int limit = 10)
        {
            try
            {
                var posts = _postService.GetPendingPosts(page, limit);
                return Ok(posts);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // GET /api/moderator/comments/reported
        [HttpGet("comments/reported")]
        public ActionResult<IEnumerable<ReportedCommentDTO>> GetReportedComments(
            [FromQuery] int page = 1,
            [FromQuery] int limit = 10)
        {
            if (!IsModeratorOrAdmin())
            {
                return Unauthorized("Access denied. Moderator or Admin role required.");
            }

            try
            {
                var comments = _commentService.GetReportedComments(page, limit);
                return Ok(comments);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // GET /api/moderator/posts/rejected
        [HttpGet("posts/rejected")]
        public ActionResult<IEnumerable<PostDTO>> GetRejectedPosts(
            [FromQuery] int page = 1,
            [FromQuery] int limit = 10)
        {
            try
            {
                var posts = _postService.GetRejectedPosts(page, limit);
                return Ok(posts);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // POST /api/moderator/posts/{id}/approve
        [HttpPost("posts/{id}/approve")]
        public ActionResult ApprovePost(int id)
        {
            try
            {
                _postService.ApprovePost(id);
                return Ok(new { message = "Post approved successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // POST /api/moderator/posts/{id}/reject
        [HttpPost("posts/{id}/reject")]
        public ActionResult RejectPost(int id, [FromBody] RejectPostRequestDTO request)
        {
            try
            {
                _postService.RejectPost(id, request.Reason);
                return Ok(new { message = "Post rejected successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // GET /api/moderator/posts/{id}
        [HttpGet("posts/{id}")]
        public ActionResult<PostDTO> GetPostDetail(int id)
        {
            try
            {
                var post = _postService.GetPostById(id);
                if (post == null) return NotFound("Post not found");
                return Ok(post);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // GET /api/moderator/users
        [HttpGet("users")]
        public ActionResult<IEnumerable<UserStatsDTO>> GetUsers(
            [FromQuery] int page = 1,
            [FromQuery] int limit = 10)
        {
            try
            {
                var users = _userService.GetUsersWithStats(page, limit);
                return Ok(users);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // GET /api/moderator/users/{id}/stats
        [HttpGet("users/{id}/stats")]
        public ActionResult<UserStatsDTO> GetUserStats(int id)
        {
            try
            {
                var stats = _userService.GetUserStats(id);
                if (stats == null) return NotFound("User not found");
                return Ok(stats);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // GET /api/moderator/chart/posts
        [HttpGet("chart/posts")]
        public ActionResult<IEnumerable<ChartDataDTO>> GetPostsChartData(
            [FromQuery] int month,
            [FromQuery] int year)
        {
            try
            {
                var data = _postService.GetPostsChartData(month, year);
                return Ok(data);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // GET /api/moderator/notifications
        [HttpGet("notifications")]
        public ActionResult<IEnumerable<NotificationDTO>> GetNotifications()
        {
            try
            {
                var notifications = _postService.GetModeratorNotifications();
                return Ok(notifications);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // PUT /api/moderator/notifications/{id}/read
        [HttpPut("notifications/{id}/read")]
        public ActionResult MarkNotificationAsRead(int id)
        {
            try
            {
                _postService.MarkNotificationAsRead(id);
                return Ok(new { message = "Notification marked as read" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // POST /api/moderator/reports/{id}/approve
        [HttpPost("reports/{id}/approve")]
        public ActionResult ApproveReport(int id)
        {
            var currentUser = GetCurrentUser();
            if (currentUser == null)
            {
                return Unauthorized("User not authenticated. Please login again.");
            }
            
            if (currentUser.Role != "moderator" && currentUser.Role != "admin")
            {
                return Unauthorized($"Access denied. Current role: '{currentUser.Role}'. Moderator or Admin role required.");
            }

            try
            {
                _commentService.ApproveReport(id);
                return Ok(new { message = "Report approved successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // POST /api/moderator/reports/{id}/dismiss
        [HttpPost("reports/{id}/dismiss")]
        public ActionResult DismissReport(int id)
        {
            var currentUser = GetCurrentUser();
            if (currentUser == null)
            {
                return Unauthorized("User not authenticated. Please login again.");
            }
            
            if (currentUser.Role != "moderator" && currentUser.Role != "admin")
            {
                return Unauthorized($"Access denied. Current role: '{currentUser.Role}'. Moderator or Admin role required.");
            }

            try
            {
                _commentService.DismissReport(id);
                return Ok(new { message = "Report dismissed successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // POST /api/moderator/users/{userId}/restrict
        [HttpPost("users/{userId}/restrict")]
        public ActionResult RestrictUser(int userId)
        {
            if (!IsModeratorOrAdmin())
            {
                return Unauthorized("Only moderators and admins can restrict users");
            }

            try
            {
                _userService.RestrictUser(userId);
                return Ok(new { message = "User restricted successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // POST /api/moderator/users/{userId}/unrestrict
        [HttpPost("users/{userId}/unrestrict")]
        public ActionResult UnrestrictUser(int userId)
        {
            if (!IsModeratorOrAdmin())
            {
                return Unauthorized("Only moderators and admins can unrestrict users");
            }

            try
            {
                _userService.UnrestrictUser(userId);
                return Ok(new { message = "User unrestricted successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}


