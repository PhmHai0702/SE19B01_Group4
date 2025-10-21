import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ModeratorSidebar from "../../Components/Moderator/ModeratorSidebar";
import { getAllTags, createTag, updateTag, deleteTag } from "../../Services/TagApi";
import { getMe, logout } from "../../Services/AuthApi";
import { formatTimeVietnam } from "../../utils/date";
import {
  FileText,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Users,
  MessageSquare,
  Check,
  X,
  Bell,
  User,
  Calendar,
  TrendingUp,
  Eye,
  ThumbsUp,
  Flag,
  Clock,
  Tag,
  BarChart3,
  Filter,
  Search,
  Plus,
  Edit,
  Trash2,
  LogOut,
  Settings
} from "lucide-react";
import "./ModeratorDashboard.css";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from "chart.js";
import * as ModeratorApi from "../../Services/ModeratorApi";
import { getPostsByFilter } from "../../Services/ForumApi";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

export default function ModeratorDashboard() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState("overview");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reported: 0,
    rejected: 0
  });
  const [chartData, setChartData] = useState([]);
  const [users, setUsers] = useState([]);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [reportedPosts, setReportedPosts] = useState([]);
  const [rejectedPosts, setRejectedPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostDetail, setShowPostDetail] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  
  // New state for forum posts
  const [allPosts, setAllPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsFilter, setPostsFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Tag management states
  const [tags, setTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [tagName, setTagName] = useState('');
  const [tagError, setTagError] = useState('');
  
  // User states
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Load data from API
  useEffect(() => {
    loadDashboardData();
    loadUserData();
  }, [selectedMonth]);

  const loadUserData = async () => {
    try {
      const response = await getMe();
      setUser(response.data);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      navigate('/login');
    }
  };

  // Load forum posts when overview is selected
  useEffect(() => {
    if (currentView === "overview") {
      loadAllPosts();
    }
  }, [currentView, postsFilter]);

  // Load tags when tags view is selected
  useEffect(() => {
    if (currentView === 'tags') {
      loadTags();
    }
  }, [currentView]);

  const loadDashboardData = async () => {
    try {
      // Load dashboard stats
      const statsResponse = await ModeratorApi.getModeratorStats();
      setStats({
        total: statsResponse.data.totalPosts,
        pending: statsResponse.data.pendingPosts,
        reported: statsResponse.data.reportedPosts,
        rejected: statsResponse.data.rejectedPosts
      });

      // Load chart data
      const currentYear = new Date().getFullYear();
      const chartResponse = await ModeratorApi.getPostsChartData(selectedMonth, currentYear);
      setChartData(chartResponse.data);

      // Load users data
      const usersResponse = await ModeratorApi.getUsers();
      setUsers(usersResponse.data);

      // Load pending posts
      const pendingResponse = await ModeratorApi.getPendingPosts();
      setPendingPosts(pendingResponse.data);

      // Load reported posts
      const reportedResponse = await ModeratorApi.getReportedPosts();
      setReportedPosts(reportedResponse.data);

      // Load rejected posts
      const rejectedResponse = await ModeratorApi.getRejectedPosts();
      setRejectedPosts(rejectedResponse.data);

    } catch (error) {
      console.error("Error loading dashboard data:", error);
      // Fallback to mock data if API fails
      setStats({
        total: 150,
        pending: 8,
        reported: 12,
        rejected: 5
      });

      // Fallback chart data
      setChartData([
        { label: "1/12", value: 5 },
        { label: "2/12", value: 8 },
        { label: "3/12", value: 12 },
        { label: "4/12", value: 6 },
        { label: "5/12", value: 15 },
        { label: "6/12", value: 9 },
        { label: "7/12", value: 11 }
      ]);

      // Fallback users data
      setUsers([
        {
          userId: 1,
          username: "john_doe",
          email: "john@example.com",
          totalPosts: 25,
          totalComments: 45,
          approvedPosts: 20,
          rejectedPosts: 3,
          reportedPosts: 2
        },
        {
          userId: 2,
          username: "jane_smith",
          email: "jane@example.com",
          totalPosts: 18,
          totalComments: 32,
          approvedPosts: 15,
          rejectedPosts: 2,
          reportedPosts: 1
        },
        {
          userId: 3,
          username: "mike_wilson",
          email: "mike@example.com",
          totalPosts: 12,
          totalComments: 28,
          approvedPosts: 10,
          rejectedPosts: 1,
          reportedPosts: 1
        }
      ]);

      // Fallback posts data
      setPendingPosts([
        {
          postId: 1,
          id: 1,
          title: "IELTS Reading Tips for Beginners",
          content: "Here are some useful tips for IELTS reading...",
          author: "john_doe",
          createdAt: "2024-12-07T10:30:00Z",
          status: "pending"
        },
        {
          postId: 2,
          id: 2,
          title: "How to Improve Writing Task 2",
          content: "I want to share my experience with writing task 2...",
          author: "jane_smith",
          createdAt: "2024-12-07T09:15:00Z",
          status: "pending"
        }
      ]);

      setReportedPosts([
        {
          id: 3,
          title: "Spam Post Example",
          content: "This is a spam post...",
          author: "spam_user",
          createdAt: "2024-12-06T14:20:00Z",
          reportReason: "Spam content",
          reportCount: 3
        }
      ]);
    }
  };

  const loadAllPosts = async () => {
    try {
      setPostsLoading(true);
      const response = await getPostsByFilter(postsFilter, 1, 50);
      setAllPosts(response.data || []);
    } catch (error) {
      console.error("Error loading posts:", error);
      setAllPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleAcceptPost = async (postId) => {
    try {
      await ModeratorApi.approvePost(postId);
      // Update local state
      setPendingPosts(prev => prev.filter(post => (post.postId || post.id) !== postId));
      setStats(prev => ({ ...prev, pending: prev.pending - 1, total: prev.total + 1 }));
      setShowPostDetail(false);
      alert("Post approved successfully!");
    } catch (error) {
      console.error("Error approving post:", error);
      alert("Error approving post. Please try again.");
    }
  };

  const handleRejectPost = async (postId, reason) => {
    try {
      await ModeratorApi.rejectPost(postId, reason);
      // Update local state
      setPendingPosts(prev => prev.filter(post => (post.postId || post.id) !== postId));
      setStats(prev => ({ ...prev, pending: prev.pending - 1, rejected: prev.rejected + 1 }));
      setShowPostDetail(false);
      setRejectReason("");
      alert("Post rejected successfully!");
    } catch (error) {
      console.error("Error rejecting post:", error);
      alert("Error rejecting post. Please try again.");
    }
  };

  const handleViewPost = (post) => {
    setSelectedPost(post);
    setShowPostDetail(true);
  };

  const chartConfig = {
    labels: chartData.map(item => item.label || item.day),
    datasets: [
      {
        label: "Posts per day",
        data: chartData.map(item => item.value || item.posts),
        borderColor: "#007bff",
        backgroundColor: "rgba(0, 123, 255, 0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 16
        },
        bodyFont: {
          size: 14
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            size: 12
          }
        }
      }
    }
  };

  const renderOverview = () => (
    <div className="moderator-content">
      <div className="posts-header">
        <h1 className="page-title">All Forum Posts</h1>
        
        <div className="posts-controls">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="filter-select">
            <Filter size={16} />
            <select 
              value={postsFilter} 
              onChange={(e) => setPostsFilter(e.target.value)}
            >
              <option value="all">All Posts</option>
              <option value="new">New</option>
              <option value="top">Top</option>
              <option value="hot">Hot</option>
              <option value="pending">Pending</option>
              <option value="reported">Reported</option>
            </select>
          </div>
        </div>
      </div>

      {postsLoading ? (
        <div className="loading">Loading posts...</div>
      ) : (
        <div className="posts-list">
          {allPosts.length === 0 ? (
            <div className="no-posts">No posts found</div>
          ) : (
            allPosts.map(post => (
              <div key={post.postId} className="post-card">
                <div className="post-header">
                  <h3>{post.title}</h3>
                  <span className={`post-status ${post.status}`}>
                    {post.status === 'pending' ? 'Pending' : 
                     post.status === 'rejected' ? 'Rejected' : 
                     post.status === 'approved' ? 'Approved' : post.status}
                  </span>
                </div>
                
                <div className="post-meta">
                  <div className="post-author">
                    <User size={16} />
                    <span>@{post.user?.username || 'Unknown'}</span>
                  </div>
                  <div className="post-time">
                    <Clock size={16} />
                    <span>{formatTimeVietnam(post.createdAt)}</span>
                  </div>
                  <div className="post-stats">
                    <ThumbsUp size={16} />
                    <span>{post.voteCount || 0}</span>
                    <MessageSquare size={16} />
                    <span>{post.commentCount || 0}</span>
                    <Eye size={16} />
                    <span>{post.viewCount || 0}</span>
                  </div>
                </div>

                <div className="post-content">
                  {post.content && post.content.length > 200 
                    ? `${post.content.substring(0, 200)}...` 
                    : post.content || ''}
                </div>

                {post.tags && post.tags.length > 0 && (
                  <div className="post-tags">
                    {post.tags.map((tag, index) => (
                      <span key={index} className="post-tag">
                        #{tag.tagName}
                      </span>
                    ))}
                  </div>
                )}

                <div className="post-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleViewPost(post)}
                  >
                    <Eye size={16} />
                    View Detail
                  </button>
                  
                  {post.status === 'pending' && (
                    <>
                      <button 
                        className="btn btn-success"
                        onClick={() => handleAcceptPost(post.postId)}
                      >
                        <Check size={16} />
                        Approve
                      </button>
                      <button 
                        className="btn btn-danger"
                        onClick={() => {
                          const reason = prompt("Enter rejection reason:");
                          if (reason) {
                            handleRejectPost(post.postId, reason);
                          }
                        }}
                      >
                        <X size={16} />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );

  const renderPendingPosts = () => (
    <div className="moderator-content">
      <h1 className="page-title">Pending Posts</h1>
      <div className="posts-list">
        {pendingPosts.map(post => (
          <div key={post.id} className="post-card">
            <div className="post-header">
              <h3>{post.title}</h3>
              <span className="post-status pending">Pending</span>
            </div>
            <div className="post-meta">
              <span>By: {post.user?.username || 'Unknown'}</span>
              <span>{formatTimeVietnam(post.createdAt)}</span>
            </div>
            <div className="post-content">
              {post.content.substring(0, 200)}...
            </div>
            <div className="post-actions">
              <button 
                className="btn btn-primary"
                onClick={() => handleViewPost(post)}
              >
                <Eye size={16} />
                View Detail
              </button>
              <button 
                className="btn btn-success"
                onClick={() => handleAcceptPost(post.postId || post.id)}
              >
                <Check size={16} />
                Accept
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => {
                  const reason = prompt("Enter rejection reason:");
                  if (reason) {
                    handleRejectPost(post.postId || post.id, reason);
                  }
                }}
              >
                <X size={16} />
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReportedPosts = () => (
    <div className="moderator-content">
      <h1 className="page-title">Reported Posts</h1>
      <div className="posts-list">
        {reportedPosts.map(post => (
          <div key={post.id} className="post-card">
            <div className="post-header">
              <h3>{post.title}</h3>
              <span className="post-status reported">Reported ({post.reportCount})</span>
            </div>
            <div className="post-meta">
              <span>By: {post.user?.username || 'Unknown'}</span>
              <span>{formatTimeVietnam(post.createdAt)}</span>
            </div>
            <div className="post-content">
              {post.content.substring(0, 200)}...
            </div>
            <div className="report-reason">
              <strong>Report Reason:</strong> {post.reportReason}
            </div>
            <div className="post-actions">
              <button 
                className="btn btn-primary"
                onClick={() => handleViewPost(post)}
              >
                <Eye size={16} />
                View Detail
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRejectedPosts = () => (
    <div className="moderator-content">
      <h1 className="page-title">Rejected Posts</h1>
      <div className="posts-list">
        {rejectedPosts.map(post => (
          <div key={post.postId} className="post-card">
            <div className="post-header">
              <h3>{post.title}</h3>
              <span className="post-status rejected">Rejected</span>
            </div>
            <div className="post-meta">
              <span>Author: {post.user?.username || 'Unknown'}</span>
              <span>Date: {formatTimeVietnam(post.createdAt)}</span>
              {post.rejectionReason && (
                <span className="rejection-reason">Reason: {post.rejectionReason}</span>
              )}
            </div>
            <div className="post-content">
              {post.content.substring(0, 200)}...
            </div>
            <div className="post-actions">
              <button 
                className="btn btn-primary"
                onClick={() => handleViewPost(post)}
              >
                <Eye size={16} />
                View Detail
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStatistics = () => (
    <div className="moderator-content">
      <h1 className="page-title">Statistics Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Posts</h3>
            <p className="stat-number">{stats.total}</p>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>Pending</h3>
            <p className="stat-number">{stats.pending}</p>
          </div>
        </div>

        <div className="stat-card reported">
          <div className="stat-icon">
            <Flag size={24} />
          </div>
          <div className="stat-content">
            <h3>Reported</h3>
            <p className="stat-number">{stats.reported}</p>
          </div>
        </div>

        <div className="stat-card rejected">
          <div className="stat-icon">
            <XCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Rejected</h3>
            <p className="stat-number">{stats.rejected}</p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="chart-section">
        <div className="chart-header">
          <h2>Posts Statistics</h2>
          <div className="month-selector">
            <Calendar size={16} />
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            >
              <option value={1}>January</option>
              <option value={2}>February</option>
              <option value={3}>March</option>
              <option value={4}>April</option>
              <option value={5}>May</option>
              <option value={6}>June</option>
              <option value={7}>July</option>
              <option value={8}>August</option>
              <option value={9}>September</option>
              <option value={10}>October</option>
              <option value={11}>November</option>
              <option value={12}>December</option>
            </select>
          </div>
        </div>
        <div className="chart-container">
          <Line data={chartConfig} options={chartOptions} />
        </div>
      </div>

      {/* Users Table */}
      <div className="users-section">
        <h2>Users Management</h2>
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Posts</th>
                <th>Comments</th>
                <th>Approved</th>
                <th>Rejected</th>
                <th>Reported</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.userId || user.id}>
                  <td>
                    <div className="user-info">
                      <User size={16} />
                      <div>
                        <div className="username">{user.username}</div>
                        <div className="email">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{user.totalPosts || user.posts || 0}</td>
                  <td>{user.totalComments || user.comments || 0}</td>
                  <td><span className="approved">{user.approvedPosts || user.approved || 0}</span></td>
                  <td><span className="rejected">{user.rejectedPosts || user.rejected || 0}</span></td>
                  <td><span className="reported">{user.reportedPosts || user.reported || 0}</span></td>
                  <td>
                    <button className="btn-action view">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Tag management functions
  const loadTags = async () => {
    try {
      setTagsLoading(true);
      const response = await getAllTags();
      setTags(response);
    } catch (error) {
      console.error('Error loading tags:', error);
      setTagError('Failed to load tags');
    } finally {
      setTagsLoading(false);
    }
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();
    if (!tagName.trim()) {
      setTagError('Tag name is required');
      return;
    }

    try {
      await createTag({ tagName: tagName.trim() });
      setTagName('');
      setShowTagModal(false);
      setTagError('');
      loadTags();
    } catch (error) {
      console.error('Error creating tag:', error);
      setTagError(error.response?.data?.message || 'Failed to create tag');
    }
  };

  const handleEditTag = async (e) => {
    e.preventDefault();
    if (!tagName.trim()) {
      setTagError('Tag name is required');
      return;
    }

    try {
      await updateTag(editingTag.tagId, { tagName: tagName.trim() });
      setTagName('');
      setEditingTag(null);
      setShowTagModal(false);
      setTagError('');
      loadTags();
    } catch (error) {
      console.error('Error updating tag:', error);
      setTagError(error.response?.data?.message || 'Failed to update tag');
    }
  };

  const handleDeleteTag = async (tagId) => {
    if (!window.confirm('Are you sure you want to delete this tag?')) {
      return;
    }

    try {
      await deleteTag(tagId);
      loadTags();
    } catch (error) {
      console.error('Error deleting tag:', error);
      setTagError('Failed to delete tag');
    }
  };

  const openEditModal = (tag) => {
    setEditingTag(tag);
    setTagName(tag.tagName);
    setShowTagModal(true);
    setTagError('');
  };

  const closeModal = () => {
    setShowTagModal(false);
    setEditingTag(null);
    setTagName('');
    setTagError('');
  };

  const renderTags = () => (
    <div className="moderator-content">
      <div className="tag-header">
        <h1>Tag Management</h1>
        <button 
          className="btn-primary"
          onClick={() => setShowTagModal(true)}
        >
          <Plus size={20} />
          Create Tag
        </button>
      </div>

      {tagError && (
        <div className="error-message">
          {tagError}
        </div>
      )}

      {tagsLoading ? (
        <div className="loading">Loading tags...</div>
      ) : (
        <div className="tags-list">
          {tags.length === 0 ? (
            <div className="no-tags">
              <p>No tags found. Create your first tag!</p>
            </div>
          ) : (
            tags.map(tag => (
              <div key={tag.tagId} className="tag-card">
                <div className="tag-info">
                  <span className="tag-name">#{tag.tagName}</span>
                  <span className="tag-count">{tag.postCount || 0} posts</span>
                </div>
                <div className="tag-actions">
                  <button 
                    className="btn-edit"
                    onClick={() => openEditModal(tag)}
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    className="btn-delete"
                    onClick={() => handleDeleteTag(tag.tagId)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tag Modal */}
      {showTagModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingTag ? 'Edit Tag' : 'Create Tag'}</h2>
              <button className="close-btn" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={editingTag ? handleEditTag : handleCreateTag}>
              <div className="form-group">
                <label>Tag Name</label>
                <input
                  type="text"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="Enter tag name"
                  required
                />
              </div>
              {tagError && (
                <div className="error-message">{tagError}</div>
              )}
              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingTag ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderNotifications = () => (
    <div className="moderator-content">
      <h1 className="page-title">Notifications</h1>
      <div className="notifications-list">
        <div className="notification-item">
          <Bell size={20} />
          <div className="notification-content">
            <h4>New pending post</h4>
            <p>john_doe submitted a new post for review</p>
            <span className="notification-time">2 hours ago</span>
          </div>
        </div>
        <div className="notification-item">
          <Flag size={20} />
          <div className="notification-content">
            <h4>Post reported</h4>
            <p>User reported "Spam Post Example" for inappropriate content</p>
            <span className="notification-time">4 hours ago</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="moderator-dashboard">
      {/* Header Bar */}
      <header className="moderator-header">
        <div className="header-left">
          <h1>Moderator Dashboard</h1>
        </div>
        <div className="header-right">
          <div className="user-menu">
            <button 
              className="user-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <User size={20} />
              <span>{user?.username || 'Moderator'}</span>
            </button>
            {showUserMenu && (
              <div className="user-dropdown">
                <button 
                  className="dropdown-item"
                  onClick={() => navigate('/moderator/profile')}
                >
                  <User size={16} />
                  Profile
                </button>
                <button 
                  className="dropdown-item"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="moderator-content-wrapper">
        <ModeratorSidebar 
          currentView={currentView} 
          onViewChange={setCurrentView}
        />
        
        <main className="moderator-main">
          {currentView === "overview" && renderOverview()}
          {currentView === "statistics" && renderStatistics()}
          {currentView === "tags" && renderTags()}
          {currentView === "pending" && renderPendingPosts()}
          {currentView === "reported" && renderReportedPosts()}
          {currentView === "rejected" && renderRejectedPosts()}
        </main>
      </div>

      {/* Post Detail Modal */}
      {showPostDetail && selectedPost && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{selectedPost.title}</h2>
              <button 
                className="close-btn"
                onClick={() => setShowPostDetail(false)}
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="post-meta">
                <span>Author: {selectedPost.author}</span>
                <span>Date: {formatTimeVietnam(selectedPost.createdAt)}</span>
              </div>
              
              <div className="post-content-full">
                {selectedPost.content}
              </div>

              {selectedPost.reportReason && (
                <div className="report-info">
                  <h4>Report Reason:</h4>
                  <p>{selectedPost.reportReason}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {selectedPost.status === "pending" ? (
                <>
                  <button 
                    className="btn btn-success"
                    onClick={() => handleAcceptPost(selectedPost.id)}
                  >
                    <CheckCircle size={16} />
                    Accept
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => {
                      const reason = prompt("Enter rejection reason:");
                      if (reason) {
                        handleRejectPost(selectedPost.id, reason);
                      }
                    }}
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                </>
              ) : (
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowPostDetail(false)}
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
