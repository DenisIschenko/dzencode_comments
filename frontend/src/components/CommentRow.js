import React, {useState} from 'react';
import CommentForm from './CommentForm';

const CommentRow = ({comment, onRefresh}) => {
    const [showReplyForm, setShowReplyForm] = useState(false);

    return (
        <div className="comment-grid">
            <div className="comment-cell username">{comment.user_name}</div>
            <div className="comment-cell email">{comment.email}</div>
            <div className="comment-cell text">
                <div dangerouslySetInnerHTML={{__html: comment.text}}/>
            </div>
            <div className="comment-cell date">
                {new Date(comment.created_at).toLocaleString()}
            </div>

            <div className="comment-cell cleanup">
                <button onClick={() => setShowReplyForm(!showReplyForm)}>
                    {showReplyForm ? 'Cancel' : 'Reply'}
                </button>
                {showReplyForm && (
                    <CommentForm
                        parentId={comment.id}
                        onSuccess={() => {
                            setShowReplyForm(false);
                            onRefresh();
                        }}
                    />
                )}
                <div className="comment-replies">
                    {comment.replies?.map(reply => (
                        <CommentRow
                            key={reply.id}
                            comment={reply}
                            onRefresh={onRefresh}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CommentRow;