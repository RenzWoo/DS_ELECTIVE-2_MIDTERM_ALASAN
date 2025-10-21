// ============================================
// DATA STORAGE (In-Memory with Session Persistence)
// ============================================

const BRAINROT_KEYWORDS = ['skibidi', 'rizz', 'gyat', 'sigma', 'ohio', 'fanum tax', 'griddy'];

// Session state - persists across pages using sessionStorage
const AppState = {
    get currentUser() {
        const user = sessionStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    },
    set currentUser(user) {
        if (user) {
            sessionStorage.setItem('currentUser', JSON.stringify(user));
        } else {
            sessionStorage.removeItem('currentUser');
        }
    },
    get users() {
        const users = sessionStorage.getItem('users');
        return users ? JSON.parse(users) : this.getDefaultUsers();
    },
    set users(users) {
        sessionStorage.setItem('users', JSON.stringify(users));
    },
    get posts() {
        const posts = sessionStorage.getItem('posts');
        return posts ? JSON.parse(posts).map(p => ({
            ...p, 
            timestamp: new Date(p.timestamp),
            comments: p.comments.map(c => ({...c, timestamp: new Date(c.timestamp)}))
        })) : this.getDefaultPosts();
    },
    set posts(posts) {
        sessionStorage.setItem('posts', JSON.stringify(posts));
    },
    get likedPosts() {
        const liked = sessionStorage.getItem('likedPosts');
        return liked ? new Set(JSON.parse(liked)) : new Set();
    },
    set likedPosts(likedSet) {
        sessionStorage.setItem('likedPosts', JSON.stringify([...likedSet]));
    },
    getDefaultUsers() {
        return [
            { 
                id: 1, 
                username: 'john_doe', 
                email: 'john@example.com', 
                password: 'password123', 
                bio: 'Quality content creator', 
                followers: 234, 
                following: 189 
            },
            { 
                id: 2, 
                username: 'jane_smith', 
                email: 'jane@example.com', 
                password: 'pass456', 
                bio: 'Tech enthusiast | Coffee lover', 
                followers: 567, 
                following: 234 
            }
        ];
    },
    getDefaultPosts() {
        return [
            { 
                id: 1, 
                userId: 1, 
                username: 'john_doe', 
                content: 'Just finished reading a great book on philosophy. Highly recommend!', 
                likes: 45, 
                comments: [
                    {
                        id: 1,
                        userId: 2,
                        username: 'jane_smith',
                        content: 'Which book was it? I love philosophy!',
                        timestamp: new Date(Date.now() - 3000000)
                    }
                ], 
                timestamp: new Date(Date.now() - 3600000) 
            },
            { 
                id: 2, 
                userId: 2, 
                username: 'jane_smith', 
                content: 'Beautiful sunset today. Nature is amazing! 🌅', 
                image: 'sunset-beach.jpg',
                likes: 89, 
                comments: [], 
                timestamp: new Date(Date.now() - 7200000) 
            }
        ];
    },
    init() {
        // Initialize default data if not exists
        if (!sessionStorage.getItem('users')) {
            this.users = this.getDefaultUsers();
        }
        if (!sessionStorage.getItem('posts')) {
            this.posts = this.getDefaultPosts();
        }
    }
};

// Initialize app state
AppState.init();

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.classList.add('show');
    setTimeout(() => {
        errorEl.classList.remove('show');
    }, 5000);
}

function detectBrainrot(content) {
    const lowerContent = content.toLowerCase();
    return BRAINROT_KEYWORDS.some(keyword => lowerContent.includes(keyword));
}

function formatTime(timestamp) {
    const diff = Date.now() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

function requireAuth() {
    const currentUser = AppState.currentUser;
    if (!currentUser) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const users = AppState.users;
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        AppState.currentUser = user;
        window.location.href = 'pages/feed.html';
    } else {
        showError('loginError', 'Invalid email or password');
    }
}

function handleSignup() {
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    // Validation
    if (!username || !email || !password || !confirmPassword) {
        showError('signupError', 'All fields are required');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('signupError', 'Passwords do not match');
        return;
    }
    
    const users = AppState.users;
    
    if (users.some(u => u.email === email)) {
        showError('signupError', 'Email already exists');
        return;
    }
    
    if (users.some(u => u.username === username)) {
        showError('signupError', 'Username already taken');
        return;
    }
    
    // Create new user
    const newUser = {
        id: users.length + 1,
        username: username,
        email: email,
        password: password,
        bio: 'New user',
        followers: 0,
        following: 0
    };
    
    users.push(newUser);
    AppState.users = users;
    AppState.currentUser = newUser;
    window.location.href = 'feed.html';
}

function handleLogout() {
    AppState.currentUser = null;
    AppState.likedPosts = new Set();
    window.location.href = '../index.html';
}

// ============================================
// POST FUNCTIONS
// ============================================

function updateComposerAvatar() {
    const currentUser = AppState.currentUser;
    const composerAvatar = document.getElementById('composerAvatar');
    if (currentUser && composerAvatar) {
        composerAvatar.textContent = currentUser.username[0].toUpperCase();
    }
}

function handleCreatePost() {
    const content = document.getElementById('newPostContent').value.trim();
    const currentUser = AppState.currentUser;
    
    if (!content || !currentUser) return;
    
    // Check for brainrot
    if (detectBrainrot(content)) {
        const warning = document.getElementById('atomizedWarning');
        warning.classList.add('show');
        setTimeout(() => {
            warning.classList.remove('show');
        }, 3000);
        document.getElementById('newPostContent').value = '';
        return;
    }
    
    // Create new post
    const posts = AppState.posts;
    const newPost = {
        id: posts.length + 1,
        userId: currentUser.id,
        username: currentUser.username,
        content: content,
        likes: 0,
        comments: [],
        timestamp: new Date()
    };
    
    posts.unshift(newPost);
    AppState.posts = posts;
    document.getElementById('newPostContent').value = '';
    renderPosts();
}

function handleLike(postId) {
    const posts = AppState.posts;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const likedPosts = AppState.likedPosts;
    
    if (likedPosts.has(postId)) {
        likedPosts.delete(postId);
        post.likes--;
    } else {
        likedPosts.add(postId);
        post.likes++;
    }
    
    AppState.likedPosts = likedPosts;
    AppState.posts = posts;
    
    // Re-render based on current page
    if (document.getElementById('postsFeed')) {
        renderPosts();
    }
    if (document.getElementById('profilePosts')) {
        updateProfilePage();
    }
}

function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    const commentInput = document.getElementById(`comment-input-${postId}`);
    
    if (commentsSection.style.display === 'none' || !commentsSection.style.display) {
        commentsSection.style.display = 'block';
        if (commentInput) commentInput.focus();
    } else {
        commentsSection.style.display = 'none';
    }
}

function handleAddComment(postId) {
    const commentInput = document.getElementById(`comment-input-${postId}`);
    const content = commentInput.value.trim();
    const currentUser = AppState.currentUser;
    
    if (!content || !currentUser) return;
    
    // Check for brainrot in comment
    if (detectBrainrot(content)) {
        const warning = document.getElementById('commentAtomizedWarning');
        warning.classList.add('show');
        setTimeout(() => {
            warning.classList.remove('show');
        }, 3000);
        commentInput.value = '';
        return;
    }
    
    const posts = AppState.posts;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    // Generate unique comment ID
    const allCommentIds = posts.flatMap(p => p.comments.map(c => c.id));
    const newCommentId = allCommentIds.length > 0 ? Math.max(...allCommentIds) + 1 : 1;
    
    const newComment = {
        id: newCommentId,
        userId: currentUser.id,
        username: currentUser.username,
        content: content,
        timestamp: new Date()
    };
    
    post.comments.push(newComment);
    AppState.posts = posts;
    
    commentInput.value = '';
    
    // Re-render based on current page
    if (document.getElementById('postsFeed')) {
        renderPosts();
        // Re-open comments section
        document.getElementById(`comments-${postId}`).style.display = 'block';
    }
    if (document.getElementById('profilePosts')) {
        updateProfilePage();
        // Re-open comments section
        const profileComments = document.getElementById(`comments-${postId}`);
        if (profileComments) profileComments.style.display = 'block';
    }
}

function renderComments(post) {
    if (!post.comments || post.comments.length === 0) {
        return '<div class="no-comments">No comments yet. Be the first to comment!</div>';
    }
    
    return post.comments.map(comment => `
        <div class="comment-item">
            <div class="comment-header">
                <div class="comment-avatar">${comment.username[0].toUpperCase()}</div>
                <div class="comment-meta">
                    <strong>${comment.username}</strong>
                    <span class="comment-time">${formatTime(comment.timestamp)}</span>
                </div>
            </div>
            <div class="comment-content">${comment.content}</div>
        </div>
    `).join('');
}

function renderPosts() {
    const feedContainer = document.getElementById('postsFeed');
    if (!feedContainer) return;
    
    feedContainer.innerHTML = '';
    const posts = AppState.posts;
    const likedPosts = AppState.likedPosts;
    
    posts.forEach(post => {
        const isLiked = likedPosts.has(post.id);
        const commentCount = post.comments ? post.comments.length : 0;
        const postCard = document.createElement('div');
        postCard.className = 'post-card';
        
        postCard.innerHTML = `
            <div class="post-header">
                <div class="avatar">${post.username[0].toUpperCase()}</div>
                <div class="post-meta">
                    <h4>${post.username}</h4>
                    <span class="post-time">${formatTime(post.timestamp)}</span>
                </div>
            </div>
            <div class="post-content">${post.content}</div>
            <div class="post-actions">
                <button class="action-btn ${isLiked ? 'liked' : ''}" onclick="handleLike(${post.id})">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    <span>${post.likes}</span>
                </button>
                <button class="action-btn" onclick="toggleComments(${post.id})">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <span>${commentCount}</span>
                </button>
                <button class="action-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="18" cy="5" r="3"></circle>
                        <circle cx="6" cy="12" r="3"></circle>
                        <circle cx="18" cy="19" r="3"></circle>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                    </svg>
                </button>
            </div>
            <div class="comments-section" id="comments-${post.id}" style="display: none;">
                <div class="comments-list">
                    ${renderComments(post)}
                </div>
                <div class="comment-input-container">
                    <input type="text" id="comment-input-${post.id}" placeholder="Write a comment..." class="comment-input">
                    <button class="btn-comment" onclick="handleAddComment(${post.id})">💬</button>
                </div>
            </div>
        `;
        
        feedContainer.appendChild(postCard);
        
        // Add Enter key support for comment input
        const commentInput = document.getElementById(`comment-input-${post.id}`);
        if (commentInput) {
            commentInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleAddComment(post.id);
                }
            });
        }
    });
}

// ============================================
// PROFILE FUNCTIONS
// ============================================

function updateProfilePage() {
    const currentUser = AppState.currentUser;
    if (!currentUser) return;
    
    // Update profile header
    const profileAvatar = document.getElementById('profileAvatar');
    const profileUsername = document.getElementById('profileUsername');
    const profileEmail = document.getElementById('profileEmail');
    const profileBio = document.getElementById('profileBio');
    const profileFollowers = document.getElementById('profileFollowers');
    const profileFollowing = document.getElementById('profileFollowing');
    
    if (profileAvatar) profileAvatar.textContent = currentUser.username[0].toUpperCase();
    if (profileUsername) profileUsername.textContent = currentUser.username;
    if (profileEmail) profileEmail.textContent = currentUser.email;
    if (profileBio) profileBio.textContent = currentUser.bio;
    if (profileFollowers) profileFollowers.textContent = currentUser.followers;
    if (profileFollowing) profileFollowing.textContent = currentUser.following;
    
    // Get user posts
    const posts = AppState.posts;
    const userPosts = posts.filter(p => p.userId === currentUser.id);
    const profilePostCount = document.getElementById('profilePostCount');
    if (profilePostCount) profilePostCount.textContent = userPosts.length;
    
    // Render user posts
    const profilePostsContainer = document.getElementById('profilePosts');
    if (!profilePostsContainer) return;
    
    profilePostsContainer.innerHTML = '';
    const likedPosts = AppState.likedPosts;
    
    if (userPosts.length === 0) {
        profilePostsContainer.innerHTML = `
            <div class="no-posts">
                <p>No posts yet. Start sharing!</p>
            </div>
        `;
    } else {
        userPosts.forEach(post => {
            const isLiked = likedPosts.has(post.id);
            const commentCount = post.comments ? post.comments.length : 0;
            const postCard = document.createElement('div');
            postCard.className = 'post-card';
            
            postCard.innerHTML = `
                <div class="post-header">
                    <div class="avatar">${post.username[0].toUpperCase()}</div>
                    <div class="post-meta">
                        <h4>${post.username}</h4>
                        <span class="post-time">${formatTime(post.timestamp)}</span>
                    </div>
                </div>
                <div class="post-content">${post.content}</div>
                <div class="post-actions">
                    <button class="action-btn ${isLiked ? 'liked' : ''}" onclick="handleLike(${post.id})">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        <span>${post.likes}</span>
                    </button>
                    <button class="action-btn" onclick="toggleComments(${post.id})">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span>${commentCount}</span>
                    </button>
                    <button class="action-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                        </svg>
                    </button>
                </div>
                <div class="comments-section" id="comments-${post.id}" style="display: none;">
                    <div class="comments-list">
                        ${renderComments(post)}
                    </div>
                    <div class="comment-input-container">
                        <input type="text" id="comment-input-${post.id}" placeholder="Write a comment..." class="comment-input">
                        <button class="btn-comment" onclick="handleAddComment(${post.id})">💬</button>
                    </div>
                </div>
            `;
            
            profilePostsContainer.appendChild(postCard);
            
            // Add Enter key support for comment input
            const commentInput = document.getElementById(`comment-input-${post.id}`);
            if (commentInput) {
                commentInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        handleAddComment(post.id);
                    }
                });
            }
        });
    }
}

// ============================================
// PAGE INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;
    const filename = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';
    
    // Public pages (don't require authentication)
    const publicPages = ['index.html', 'signup.html', ''];
    
    // Check authentication for protected pages
    if (!publicPages.includes(filename)) {
        if (!requireAuth()) {
            return;
        }
    }
    
    // Page-specific initialization
    if (filename === 'feed.html') {
        renderPosts();
        updateComposerAvatar();
        
        // Add keyboard shortcut for posting
        const postContent = document.getElementById('newPostContent');
        if (postContent) {
            postContent.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    handleCreatePost();
                }
            });
        }
    }
    
    if (filename === 'profile.html') {
        updateProfilePage();
    }
    
    if (filename === 'index.html' || filename === '') {
        // Add Enter key support for login
        const loginPassword = document.getElementById('loginPassword');
        if (loginPassword) {
            loginPassword.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleLogin();
                }
            });
        }
        
        const loginEmail = document.getElementById('loginEmail');
        if (loginEmail) {
            loginEmail.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleLogin();
                }
            });
        }
    }
    
    if (filename === 'signup.html') {
        // Add Enter key support for signup
        const signupConfirm = document.getElementById('signupConfirmPassword');
        if (signupConfirm) {
            signupConfirm.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleSignup();
                }
            });
        }
    }
});