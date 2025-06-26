import React, {useEffect, useRef, useState} from 'react';
import api from './api/axios';
import CommentForm from './components/CommentForm';
import CommentRow from './components/CommentRow';
import LoginModal from './components/LoginModal';

const App = () => {
    const [comments, setComments] = useState([]);
    const [ordering, setOrdering] = useState('-created_at');
    const [page, setPage] = useState(1);
    const [count, setCount] = useState(0);
    // const [refresh, setRefresh] = useState(0); // force refresh after submit
    const [loading, setLoading] = useState(false);

    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('access'));

    const [user, setUser] = useState(null);


    const PAGE_SIZE = 25
    const commentsRef = useRef(comments);

    const handleLoginSuccess = () => {
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        setIsLoggedIn(false);
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get('/api/me/');
                setUser(res.data);
            } catch (err) {
                setUser(null);
            }
        };
        if (isLoggedIn) {
            fetchUser();
        }
    }, [isLoggedIn]);

    useEffect(() => {
        commentsRef.current = comments;
    }, [comments]);

    const wsRef = useRef(null);

    const fetchCommentById = async (comment_id) => {
        try {
            const res = await api.get(`/api/comments/${comment_id}/`);
            handleSuccess(res.data, res.data.parent);
        } catch (err) {
            console.error("Error fetching data:", err);
        }
    };

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8000/ws/comments/');
        wsRef.current = ws;
        ws.onopen = () => {
            console.log('WebSocket connected');
        };
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'comment.created') {
                // Option 1: Refetch comments (recommended for paginated/sorted lists)
                // it will be better when have a lot of messages from different users
                // and maybe neet to disable this function from UI in future
                //setRefresh(r => r + 1);

                // Option 2: Optimistically add to the list (if on first page and LIFO)
                // setComments(comments => [data, ...comments]);
                fetchCommentById(data.id);
            }
        };
        ws.onclose = () => {
            console.log('WebSocket disconnected');
        };
        ws.onerror = (err) => {
            console.error('WebSocket error:', err);
        };
        return () => {
            ws.close();
        };
    }, []);

    const fetchComments = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/comments/', {
                params: {ordering, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE}
            });
            setComments(res.data.results);
            setCount(res.data.count);
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments()
    }, [ordering, page]);

    const handleSort = field => {
        setOrdering(prev =>
            prev === field ? `-${field}` : field
        );
    };

    const handlePageChange = newPage => {
        if (newPage >= 1 && newPage <= Math.ceil(count / PAGE_SIZE)) {
            setPage(newPage);
        }
    };

    const handleSuccess = (data, parentId) => {
        function checkReplies(comments) {
            return comments.map((item) => {
                if (item.id === parentId) {
                    const isPresent = item.replies.some(obj => obj.id === data.id);
                    if (!isPresent) {
                        item.replies = item.replies ? [data, ...item.replies] : [data];
                    }
                    return item
                }
                item.replies = checkReplies(item.replies);
                return item; // Return unchanged items
            });
        }

        if (parentId) {
            setComments(checkReplies(commentsRef.current));
        } else {
            const isPresent = commentsRef.current.some(obj => obj.id === data.id);
            if (!isPresent) {
                const newComments = [data, ...commentsRef.current];
                setComments(newComments);
            }
        }
        // setRefresh(refresh + 1);
    };

    const columns = [
        {label: 'User', field: 'user_name', sortable: true},
        {label: 'Email', field: 'email', sortable: true},
        {label: 'Text', field: null, sortable: false},
        {label: 'Date', field: 'created_at', sortable: true},
    ];

    return (

        <div className="app-container">
            <div style={{position: 'absolute', top: 10, right: 10}}>
                {isLoggedIn ? (
                    <button onClick={handleLogout}>Logout</button>
                ) : (
                    <button onClick={() => setIsLoginModalOpen(true)}>Login</button>
                )}
            </div>
            <LoginModal
                isOpen={isLoginModalOpen}
                onRequestClose={() => setIsLoginModalOpen(false)}
                onLoginSuccess={handleLoginSuccess}
            />
            {loading && (
                <div className="loader_container">
                    <div className="loader"></div>
                </div>
            )}
            <h2>Leave a comment</h2>
            <CommentForm onSuccess={handleSuccess} user={user}/>

            <h3>Top-level comments</h3>

            <div className="comment-header-grid">
                {columns.map(col =>
                    col.sortable ? (
                        <div
                            key={col.label}
                            onClick={() => handleSort(col.field)}
                            className={"sortable " + (
                                ordering === col.field
                                    ? "chevron up"
                                    : (ordering === `-${col.field}` ? 'chevron' : '')
                            )}
                        >
                            {col.label}
                        </div>
                    ) : (
                        <div key={col.label}>{col.label}</div>
                    )
                )}
            </div>

            <div className="comment-list">
                {comments.map(comment => (
                    <CommentRow
                        key={comment.id}
                        comment={comment}
                        onSuccess={handleSuccess}
                        user={user}
                    />
                ))}
            </div>

            <div className="pagination">
                <button onClick={() => handlePageChange(page - 1)} disabled={page === 1 ? true : undefined}>Prev
                </button>
                <span>Page {page} of {Math.ceil(count / PAGE_SIZE)}</span>
                <button onClick={() => handlePageChange(page + 1)}
                        disabled={Math.ceil(count / PAGE_SIZE) === page ? true : undefined}>Next
                </button>
            </div>
        </div>
    );
};

export default App;