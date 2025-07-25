// Render breadcrumb navigation
    function renderBreadcrumb() {
        const breadcrumb = document.getElementById('breadcrumb');
        breadcrumb.innerHTML = '';
        let path = [{id: null, name: 'الرئيسية'}].concat(currentPath);
        path.forEach((folder, idx) => {
            const span = document.createElement('span');
            span.textContent = folder.name;
            span.style.cursor = 'pointer';
            span.style.fontFamily = "'Cairo', 'Tajawal', 'Segoe UI', Arial, sans-serif";
            span.style.direction = 'rtl';
            span.onclick = () => {
                currentPath = currentPath.slice(0, idx);
                currentParentId = folder.id;
                loadFolders();
            };
            breadcrumb.appendChild(span);
            if (idx < path.length - 1) {
                breadcrumb.appendChild(document.createTextNode(' / '));
            }
        });
    }

    // Show/hide loader
    function showLoader() {
        document.getElementById('loader').style.display = 'block';
    }
    function hideLoader() {
        document.getElementById('loader').style.display = 'none';
    }

    // Load folders and items in current directory (فلترة حسب userId)
    async function loadFolders() {
        renderBreadcrumb();
        showLoader();
        const foldersDiv = document.getElementById('folders');
        foldersDiv.innerHTML = '';
        if (!currentUserId) {
            hideLoader();
            return;
        }
        // Load folders (فقط للمستخدم الحالي)
        let folderQuery = db.collection('folders')
            .where('parentId', '==', currentParentId)
            .where('userId', '==', currentUserId);
        const folderSnap = await folderQuery.get();
        // Load items (videos/files) (فقط للمستخدم الحالي)
        let itemQuery = db.collection('items')
            .where('parentId', '==', currentParentId)
            .where('userId', '==', currentUserId);
        const itemSnap = await itemQuery.get();
        hideLoader();
        foldersDiv.innerHTML = '';
        // Render folders
        folderSnap.forEach(doc => {
            const data = doc.data();
            if (currentParentId === null) {
                // عرض كارت الكورس
                const card = document.createElement('div');
                card.className = 'course-card';
                card.style.fontFamily = "'Cairo', 'Tajawal', 'Segoe UI', Arial, sans-serif";
                card.style.direction = 'rtl';
                // صورة الكورس
                const img = document.createElement('img');
                img.className = 'course-card-img';
                img.src = data.courseImg || 'https://via.placeholder.com/370x120?text=Course+Image';
                img.style.cursor = 'pointer';
                img.onclick = (e) => {
                    e.stopPropagation();
                    if (data.courseImg) showImgPreview(data.courseImg);
                };
                card.appendChild(img);
                // بادج الوقت (اختياري)
                if (data.courseDuration) {
                    const badge = document.createElement('div');
                    badge.className = 'course-card-badge';
                    badge.textContent = data.courseDuration;
                    card.appendChild(badge);
                }
                // جسم الكارت (اجعل الجسم كله قابل للنقر للدخول)
                const body = document.createElement('div');
                body.className = 'course-card-body';
                body.style.cursor = 'pointer';
                body.onclick = () => {
                    currentPath.push({id: doc.id, name: data.name});
                    currentParentId = doc.id;
                    loadFolders();
                };
                // اسم الكورس
                const title = document.createElement('div');
                title.className = 'course-card-title';
                title.textContent = data.name || '';
                title.style.fontFamily = "'Cairo', 'Tajawal', 'Segoe UI', Arial, sans-serif";
                title.style.direction = 'rtl';
                body.appendChild(title);
                // وصف الكورس
                const desc = document.createElement('div');
                desc.className = 'course-card-desc';
                desc.textContent = data.courseInfo || '';
                desc.style.fontFamily = "'Cairo', 'Tajawal', 'Segoe UI', Arial, sans-serif";
                desc.style.direction = 'rtl';
                body.appendChild(desc);
                card.appendChild(body);
                // الفوتر: المحاضر والسعر
                const footer = document.createElement('div');
                footer.className = 'course-card-footer';
                // المحاضر
                const instructor = document.createElement('div');
                instructor.className = 'course-card-instructor';
                if (data.instructorImg) {
                    const instructorImg = document.createElement('img');
                    instructorImg.className = 'course-card-instructor-img';
                    instructorImg.src = data.instructorImg;
                    instructorImg.style.cursor = 'pointer';
                    instructorImg.onclick = (e) => {
                        e.stopPropagation();
                        showInstructorImgPreview(data.instructorImg);
                    };
                    instructor.appendChild(instructorImg);
                }
                const instructorName = document.createElement('span');
                instructorName.textContent = data.instructor || '';
                instructorName.style.fontFamily = "'Cairo', 'Tajawal', 'Segoe UI', Arial, sans-serif";
                instructorName.style.direction = 'rtl';
                instructor.appendChild(instructorName);
                footer.appendChild(instructor);
                // السعر
                const price = document.createElement('div');
                price.className = 'course-card-price';
                price.textContent = (data.coursePrice ? data.coursePrice + ' جنية' : '');
                price.style.fontFamily = "'Cairo', 'Tajawal', 'Segoe UI', Arial, sans-serif";
                price.style.direction = 'ltr';
                footer.appendChild(price);
                card.appendChild(footer);
                // أزرار الإجراءات
                const actions = document.createElement('div');
                actions.className = 'course-card-actions';
                // زر خصائص
                const propsBtn = document.createElement('button');
                propsBtn.textContent = 'خصائص';
                propsBtn.onclick = async (e) => {
                    e.stopPropagation();
                    const folderDoc = await db.collection('folders').doc(doc.id).get();
                    const d = folderDoc.data() || {};
                    openModal('root-props', {
                        id: doc.id,
                        instructor: d.instructor || '',
                        instructorImg: d.instructorImg || '',
                        courseImg: d.courseImg || '',
                        courseInfo: d.courseInfo || '',
                        coursePrice: d.coursePrice || '',
                        name: d.name || ''
                    });
                };
                actions.appendChild(propsBtn);
                // زر إعادة التسمية
                const renameBtn = document.createElement('button');
                renameBtn.textContent = 'إعادة تسمية';
                renameBtn.onclick = (e) => {
                    e.stopPropagation();
                    openModal('edit-folder', {id: doc.id, name: data.name});
                };
                actions.appendChild(renameBtn);
                // زر حذف
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'حذف';
                deleteBtn.onclick = async (e) => {
                    e.stopPropagation();
                    if (confirm('هل أنت متأكد من حذف هذا المجلد وكل محتوياته؟')) {
                        await deleteFolderRecursive(doc.id);
                        loadFolders();
                    }
                };
                actions.appendChild(deleteBtn);
                // لا تضف زر النقل هنا للمجلدات الجذرية
                card.appendChild(actions);
                foldersDiv.appendChild(card);
            } else {
                const div = document.createElement('div');
                div.className = 'folder subfolder';
                div.style.fontFamily = "'Cairo', 'Tajawal', 'Segoe UI', Arial, sans-serif";
                div.style.direction = 'rtl';
                div.style.cursor = 'pointer';
                div.style.flexWrap = 'wrap'; // أضف هذا السطر
                div.onclick = (e) => {
                    if (e.target.tagName === 'BUTTON') return;
                    currentPath.push({id: doc.id, name: data.name});
                    currentParentId = doc.id;
                    loadFolders();
                };
                // صورة مجلد
                const icon = document.createElement('img');
                icon.className = 'folder-icon';
                icon.src = 'https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/folder.svg';
                icon.alt = 'مجلد';
                div.appendChild(icon);
                // اسم المجلد
                const nameSpan = document.createElement('span');
                nameSpan.className = 'folder-name';
                nameSpan.textContent = data.name;
                nameSpan.style.fontFamily = "'Cairo', 'Tajawal', 'Segoe UI', Arial, sans-serif";
                nameSpan.style.direction = 'rtl';
                nameSpan.style.minWidth = '0'; // أضف هذا السطر
                nameSpan.style.wordBreak = 'break-word'; // أضف هذا السطر
                nameSpan.style.flex = '1 1 180px'; // أضف هذا السطر
                nameSpan.style.maxWidth = '100%'; // أضف هذا السطر
                nameSpan.style.overflowWrap = 'anywhere'; // أضف هذا السطر
                div.appendChild(nameSpan);
                // Actions
                const actions = document.createElement('span');
                actions.className = 'actions';
                actions.style.display = 'flex';
                actions.style.flexWrap = 'wrap'; // أضف هذا السطر
                actions.style.gap = '6px'; // أضف هذا السطر
                actions.style.alignItems = 'center'; // أضف هذا السطر
                actions.style.marginTop = '6px'; // أضف هذا السطر
                const renameBtn = document.createElement('button');
                renameBtn.textContent = 'إعادة تسمية';
                renameBtn.onclick = (e) => {
                    e.stopPropagation();
                    openModal('edit-folder', {id: doc.id, name: data.name});
                };
                actions.appendChild(renameBtn);
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'حذف';
                deleteBtn.onclick = async (e) => {
                    e.stopPropagation();
                    if (confirm('هل أنت متأكد من حذف هذا المجلد وكل محتوياته؟')) {
                        await deleteFolderRecursive(doc.id);
                        loadFolders();
                    }
                };
                actions.appendChild(deleteBtn);
                const moveBtn = document.createElement('button');
                moveBtn.textContent = 'نقل';
                moveBtn.onclick = async (e) => {
                    e.stopPropagation();
                    const destId = await selectDestinationFolder(doc.id);
                    if (destId !== null && destId !== doc.id) {
                        await db.collection('folders').doc(doc.id).update({parentId: destId});
                        loadFolders();
                    }
                };
                actions.appendChild(moveBtn);
                div.appendChild(actions);
                foldersDiv.appendChild(div);
            }
        });
        // Render items (videos/files)
        itemSnap.forEach(doc => {
            const data = doc.data();
            // اختر الكلاس حسب النوع
            let itemClass = data.type === 'video' ? 'video-item' : 'file-item';
            const div = document.createElement('div');
            div.className = itemClass;
            div.style.fontFamily = "'Cairo', 'Tajawal', 'Segoe UI', Arial, sans-serif";
            div.style.direction = 'rtl';
            div.style.cursor = 'pointer';
            div.onclick = (e) => {
                if (e.target.tagName === 'BUTTON') return;
                if (data.type === 'video' && isYouTubeUrl(data.url)) {
                    showYouTubeModal(data.url);
                } else {
                    window.open(data.url, '_blank');
                }
            };
            // اسم العنصر مع الأيقونة
            const nameSpan = document.createElement('span');
            nameSpan.className = 'folder-name';
            nameSpan.style.display = 'flex';
            nameSpan.style.alignItems = 'center';
            nameSpan.style.fontFamily = "'Cairo', 'Tajawal', 'Segoe UI', Arial, sans-serif";
            nameSpan.style.direction = 'rtl';
            nameSpan.style.minWidth = '0';
            nameSpan.style.wordBreak = 'break-word';
            nameSpan.style.flex = '1 1 180px';
            nameSpan.style.maxWidth = '100%';
            nameSpan.style.overflowWrap = 'anywhere';
            // أيقونة النوع
            const icon = document.createElement('span');
            icon.className = 'item-type-icon';
            icon.textContent = data.type === 'video' ? '🎬' : '📄';
            nameSpan.appendChild(icon);
            // اسم العنصر كرابط أو سبان
            if (data.type === 'video' && isYouTubeUrl(data.url)) {
                // فيديو يوتيوب: سبان فقط (بدون رابط)
                const label = document.createElement('span');
                label.textContent = data.name;
                label.style.color = '#e53935';
                label.style.fontFamily = "'Cairo', 'Tajawal', 'Segoe UI', Arial, sans-serif";
                label.style.direction = 'ltr';
                label.style.cursor = 'pointer';
                label.onclick = (e) => {
                    e.stopPropagation();
                    showYouTubeModal(data.url);
                };
                nameSpan.appendChild(label);
            } else {
                // ملف أو فيديو غير يوتيوب: كرابط
                const link = document.createElement('a');
                link.textContent = data.name;
                link.href = data.url;
                link.target = '_blank';
                link.style.color = data.type === 'video' ? '#e53935' : '#ff6f00';
                link.style.fontFamily = "'Cairo', 'Tajawal', 'Segoe UI', Arial, sans-serif";
                link.style.direction = 'ltr';
                nameSpan.appendChild(link);
            }
            div.appendChild(nameSpan);
            // Actions
            const actions = document.createElement('span');
            actions.className = 'actions';
            actions.style.display = 'flex';
            actions.style.flexWrap = 'wrap';
            actions.style.gap = '6px';
            actions.style.alignItems = 'center';
            actions.style.marginTop = '6px';
            // Rename (edit name and url)
            const renameBtn = document.createElement('button');
            renameBtn.textContent = 'تعديل';
            renameBtn.onclick = (e) => {
                e.stopPropagation();
                openModal('edit-item', {id: doc.id, name: data.name, url: data.url, type: data.type});
            };
            actions.appendChild(renameBtn);
            // Delete
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'حذف';
            deleteBtn.onclick = async (e) => {
                e.stopPropagation();
                if (confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
                    await db.collection('items').doc(doc.id).delete();
                    loadFolders();
                }
            };
            actions.appendChild(deleteBtn);
            // Move
            const moveBtn = document.createElement('button');
            moveBtn.textContent = 'نقل';
            moveBtn.onclick = async (e) => {
                e.stopPropagation();
                const destId = await selectDestinationFolder();
                if (destId !== null && destId !== currentParentId) {
                    await db.collection('items').doc(doc.id).update({parentId: destId});
                    loadFolders();
                }
            };
            actions.appendChild(moveBtn);
            div.appendChild(actions);
            foldersDiv.appendChild(div);
        });
    }

    // دالة للتحقق إذا كان الرابط من يوتيوب
    function isYouTubeUrl(url) {
        return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(url);
    }

    // دالة لعرض نافذة منبثقة بها فيديو يوتيوب
    function showYouTubeModal(url) {
        let videoId = null;
        // استخراج ID الفيديو من الرابط
        const ytMatch = url.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([A-Za-z0-9_\-]+)/);
        if (ytMatch && ytMatch[1]) {
            videoId = ytMatch[1];
        } else {
            // fallback: حاول استخراج id من أي رابط يوتيوب
            try {
                const urlObj = new URL(url);
                if (urlObj.hostname.includes('youtube.com')) {
                    videoId = urlObj.searchParams.get('v');
                }
            } catch (e) {}
        }
        if (!videoId) {
            window.open(url, '_blank');
            return;
        }
        // استخدم مشغل Plyr الجديد
        openVideoPlayer(videoId);
    }

    // دالة لإغلاق نافذة الفيديو
    function closeYouTubeModal() {
        const modal = document.getElementById('youtube-video-modal');
        if (modal) {
            const iframe = document.getElementById('youtube-iframe');
            if (iframe) iframe.src = '';
            modal.style.display = 'none';
        }
    }