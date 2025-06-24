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
    const [csrftoken, setcsrftoken] = useState(null);
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

    const getCookie = async (name) => {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        setcsrftoken(cookieValue);
    }


    useEffect(() => {
        fetchCaptcha();
        getCookie('csrftoken');
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
            const res = await axios.post('/api/comments/', rest, {
                headers: {
                    'X-CSRFToken': csrftoken
                }});

            if (file) {
                const uploadForm = new FormData();
                uploadForm.append('file', file);
                uploadForm.append('comment', res.data.id);
                const resf = await axios.post('/api/attachments/', uploadForm, {
                    headers: {
                        'X-CSRFToken': csrftoken
                    }});
                res.data.attachments = [...res.data.attachments, resf.data];
            }

            onSuccess && onSuccess(res.data, res.data.parent);
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


            function errorHandler(errData) {
                let errorsString = []

                if (Array.isArray(errData)) {
                    for (const error of errData) {
                        errorsString = errorsString.concat(errorHandler(error));
                    }
                } else if (typeof errData === 'object') {
                    for (const key in errData) {
                        if (errData[key] !== '__all__') {
                            errorsString.push(errData[key]);
                        }
                    }
                } else {
                    if (errData !== '__all__') {
                        errorsString.push(errData);
                    }
                }
                return errorsString;
            }

            if (err.response && err.response.data) {
                setErrors(errorHandler(err.response.data));
            } else {
                setErrors(['An unknown error occurred.']);
            }
            fetchCaptcha(); // refresh on error too
        }
    };

    const insertTag = (targetEl, openTag, closeTag = '') => {
        const textarea = targetEl.closest('form').querySelector('textarea[name="text"]');
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

    const handleInsertLink = (e) => {
        const href = prompt("Enter URL:");
        if (href) {
            insertTag(e.target, `<a href="${href}" title="">`, `</a>`);
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

            <label>Allowed HTML tags for comment:
                <div className="html-panel">
                <button type="button" onClick={(e) => insertTag(e.target, '<i>', '</i>')}>[i]</button>
                <button type="button" onClick={(e) => insertTag(e.target, '<strong>', '</strong>')}>[strong]</button>
                <button type="button" onClick={(e) => insertTag(e.target, '<code>', '</code>')}>[code]</button>
                <button type="button" onClick={handleInsertLink}>[a]</button>
            </div>
            </label>
            <textarea name="text" placeholder="Your comment" required value={formData.text} onChange={handleChange} rows='10'/>

            <label>Attachment: <input type="file" name="file" onChange={handleChange}/></label>

            {captchaImage && (
                <label>Solve CAPTCHA:
                <div className="captcha-section">
                    <img src={captchaImage} alt="captcha"/>
                    <input type="text" name="captcha_value" placeholder="Enter CAPTCHA" required
                           value={formData.captcha_value} onChange={handleChange}/>
                </div>
                </label>
            )}

            {errors && (
                <div className="errors">
                    {errors.map((error, index) => (
                        <pre key={index} className="error">{error}</pre>
                    ))}
                </div>
            )}

            <button type="submit">Submit</button>
        </form>
    );
};

export default CommentForm;