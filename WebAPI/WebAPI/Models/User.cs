﻿using System;
using System.Collections.Generic;

namespace WebAPI.Models;

public partial class User
{
    public int UserId { get; set; }

    public string Username { get; set; } = null!;

    public string Email { get; set; } = null!;

    public byte[] PasswordHash { get; set; } = null!;

    public byte[] PasswordSalt { get; set; } = null!;

    public string? Firstname { get; set; }

    public string? Lastname { get; set; }

    public string Role { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public string? Avatar { get; set; }
    public DateTime? VipExpireAt { get; set; }
    public bool IsVip => VipExpireAt != null && VipExpireAt > DateTime.UtcNow;
    public bool IsRestricted { get; set; } = false;


    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();

    public virtual ICollection<ExamAttempt> ExamAttempts { get; set; } = new List<ExamAttempt>();

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public virtual ICollection<PostLike> PostLikes { get; set; } = new List<PostLike>();

    public virtual ICollection<Post> Posts { get; set; } = new List<Post>();

    public virtual ICollection<Report> Reports { get; set; } = new List<Report>();

    public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();

    public virtual ICollection<VocabGroup> VocabGroups { get; set; } = new List<VocabGroup>();

    public virtual ICollection<UserSignInHistory> SignInHistories { get; set; } = new List<UserSignInHistory>();

}
