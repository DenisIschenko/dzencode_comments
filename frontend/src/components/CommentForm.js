import React, {useEffect, useState} from 'react';
import axios from 'axios';

const CommentForm = ({parentId = null, onSuccess}) => {
    const [formData, setFormData] = useState({
        user_name: '',
        email: '',
        home_page: '',
        text: '',
        captcha_value: '',
        captcha_key: '',
        file: null
    });

    const [captchaImage, setCaptchaImage] = useState(null);
    const [errors, setErrors] = useState(null);

    const fetchCaptcha = async () => {
        try {
            const res = await axios.get('/api/captcha/');
            setFormData(prev => ({...prev, captcha_key: res.data.captcha_key, captcha_value: ''}));
            setCaptchaImage(res.data.image_url);
        } catch (err) {
            console.error("Error fetching data:", err);
        }
    };

    useEffect(() => {
        fetchCaptcha();
    }, []);

    const handleChange = e => {
        const {name, value, files} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: files ? files[0] : value
        }));
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setErrors(null);

        try {
            const commentPayload = {
                ...formData,
                parent: parentId,
            };

            const {file, ...rest} = commentPayload;
            const res = await axios.post('/api/comments/', rest);

            if (file) {
                const uploadForm = new FormData();
                uploadForm.append('file', file);
                uploadForm.append('comment', res.data.id);
                await axios.post('/api/attachments/', uploadForm);
            }

            onSuccess && onSuccess();
            setFormData({
                user_name: '',
                email: '',
                home_page: '',
                text: '',
                captcha_value: '',
                captcha_key: '',
                file: null
            });
            fetchCaptcha();
        } catch (err) {
            setErrors(err.response?.data);
            fetchCaptcha(); // refresh on error too
        }
    };

    const insertTag = (openTag, closeTag = '') => {
        const textarea = document.querySelector('textarea[name="text"]');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = textarea.value.slice(start, end);
        const newText = textarea.value.slice(0, start) + openTag + selected + closeTag + textarea.value.slice(end);
        setFormData(prev => ({...prev, text: newText}));

        // Move cursor after inserted tag
        setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = start + openTag.length + selected.length + closeTag.length;
        }, 0);
    };

    const handleInsertLink = () => {
        const href = prompt("Enter URL:");
        if (href) {
            insertTag(`<a href="${href}" title="">`, `</a>`);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="comment-form">
            <input type="text" name="user_name" placeholder="User Name" required value={formData.user_name}
                   onChange={handleChange}/>
            <input type="email" name="email" placeholder="Email" required value={formData.email}
                   onChange={handleChange}/>
            <input type="url" name="home_page" placeholder="Homepage (optional)" value={formData.home_page}
                   onChange={handleChange}/>
            <div className="html-panel">
                <button type="button" onClick={() => insertTag('<i>', '</i>')}>[i]</button>
                <button type="button" onClick={() => insertTag('<strong>', '</strong>')}>[strong]</button>
                <button type="button" onClick={() => insertTag('<code>', '</code>')}>[code]</button>
                <button type="button" onClick={handleInsertLink}>[a]</button>
            </div>
            <textarea name="text" placeholder="Your comment" required value={formData.text} onChange={handleChange}/>

            <label>Attachment: <input type="file" name="file" onChange={handleChange}/></label>

            {captchaImage && (
                <div className="captcha-section">
                    <img src={captchaImage} alt="captcha"/>
                    <input type="text" name="captcha_value" placeholder="Enter CAPTCHA" required
                           value={formData.captcha_value} onChange={handleChange}/>
                </div>
            )}

            {errors && <pre className="error">{JSON.stringify(errors, null, 2)}</pre>}

            <button type="submit">Submit</button>
        </form>
    );
};

export default CommentForm;