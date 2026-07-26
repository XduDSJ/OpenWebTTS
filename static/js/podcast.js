export async function generatePodcast(username, title, text, lang, engine, voice, api_key = null) {
    try {
        const response = await fetch(`/api/users/${username}/podcast`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title,
                text,
                engine,
                lang,
                voice,
                api_key
            }),
        });

        if (!response.ok) {
            // 先读 text 再 JSON.parse，避免 body 二次消费（json() 失败后 text() 会抛 TypeError）
            const responseText = await response.text();
            let errorMsg = `Failed to generate podcast (HTTP ${response.status})`;
            try {
                const errorData = JSON.parse(responseText);
                errorMsg = errorData.detail || errorMsg;
            } catch (e) {
                // 响应不是 JSON（可能是 HTML 错误页），记录原始内容
                console.error('Non-JSON error response:', responseText);
            }
            throw new Error(errorMsg);
        }

        const data = await response.json();
        return { success: true, ...data };
    } catch (error) {
        console.error('Error generating podcast:', error);
        return { success: false, error: error.message };
    }
}

export async function getPodcasts(username) {
    try {
        const response = await fetch(`/api/users/${username}/podcasts`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to fetch podcasts.');
        }
        const data = await response.json();
        return { success: true, podcasts: data.podcasts };
    } catch (error) {
        console.error('Error fetching podcasts:', error);
        return { success: false, error: error.message };
    }
}

export async function deletePodcast(username, podcastId) {
    try {
        const response = await fetch(`/api/users/${username}/podcasts/${podcastId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to delete podcast.');
        }

        const data = await response.json();
        return { success: true, ...data };
    } catch (error) {
        console.error('Error deleting podcast:', error);
        return { success: false, error: error.message };
    }
}

export function getPodcastById(params) {
    
}