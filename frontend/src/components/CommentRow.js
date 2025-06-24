import React, {useState} from 'react';
import CommentForm from './CommentForm';
import Modal from 'react-modal';

const CommentRow = ({comment, onRefresh}) => {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [fileContent, setFileContent] = useState(null);

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
                {comment.attachments && (comment.attachments[0] && (
                    <button onClick={async () => {
                        if (comment.attachments[0].content_type === 'text/plain') {
                            const res = await fetch(comment.attachments[0].file);
                            const text = await res.text();
                            console.log(text);
                            setFileContent(text);
                        }
                        setModalIsOpen(true);
                    }}>
                        View Attachment
                    </button>
                ))}

                <Modal isOpen={modalIsOpen}
                       onRequestClose={() => {
                           setModalIsOpen(false);
                           setFileContent(null);
                       }}
                       contentLabel="Attachment Preview"
                       className="lightbox-modal"
                       overlayClassName="lightbox-overlay"
                >
                    <button onClick={() => {
                        setModalIsOpen(false);
                        setFileContent(null);
                    }}
                            aria-label="Close"
                            className="lightbox-close-btn"
                    >
                        &times;
                    </button>

                    {comment.attachments && (comment.attachments[0] && (comment.attachments[0].content_type === 'text/plain' ? (
                        <pre style={{whiteSpace: 'pre-wrap'}}>{fileContent}</pre>
                    ) : (
                        <img src={comment.attachments[0].file} alt="attachment" style={{maxWidth: '100%'}}/>
                    )))}
                </Modal>

                <button onClick={() => setShowReplyForm(!showReplyForm)}>
                    {showReplyForm ? 'Cancel' : 'Reply'}
                </button>
                {showReplyForm && (
                    <div className={'inner-form'}>
                        <CommentForm
                            parentId={comment.id}
                            onSuccess={() => {
                                setShowReplyForm(false);
                                onRefresh();
                            }}
                        />
                    </div>
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