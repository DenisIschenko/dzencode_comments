import React, {useEffect, useState} from 'react';
import axios from 'axios';
import CommentForm from './components/CommentForm';
import CommentRow from './components/CommentRow';

const App = () => {
    const [comments, setComments] = useState([]);
    const [ordering, setOrdering] = useState('-created_at');
    const [page, setPage] = useState(1);
    const [count, setCount] = useState(0);
    const [refresh, setRefresh] = useState(0); // force refresh after submit
    const [loading, setLoading] = useState(false);

    const PAGE_SIZE = 25

    const fetchComments = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/comments/', {
                params: {ordering, page}
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
    }, [ordering, page, refresh]);

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

    const handleSuccess = () => {
        setRefresh(refresh + 1);
    };

    const columns = [
        { label: 'User', field: 'user_name', sortable: true },
        { label: 'Email', field: 'email', sortable: true },
        { label: 'Text', field: null, sortable: false },
        { label: 'Date', field: 'created_at', sortable: true },
    ];

    return (

        <div className="app-container">
            {loading && (
                <div className="loader_container">
                    <div className="loader"></div>
                </div>
            )}
            <h2>Leave a comment</h2>
            <CommentForm onSuccess={handleSuccess}/>

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
                        onRefresh={() => setRefresh(refresh + 1)}
                    />
                ))}
            </div>

            <div className="pagination">
                <button onClick={() => handlePageChange(page - 1)}>Prev</button>
                <span>Page {page} of {Math.ceil(count / PAGE_SIZE)}</span>
                <button onClick={() => handlePageChange(page + 1)}>Next</button>
            </div>
        </div>
    );
};

export default App;