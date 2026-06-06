const SUPABASE_URL = "https://xyzbjnxrhzdcxuuwfvuq.supabase.co";
const SUPABASE_KEY = "sb_publishable_Kp5QnlVPRhgGm221Iz1b6Q_wHcdXmKH";
let currentUser = null;

window.onload = () => { 
    ladePlaylist(); 
};

function formatRole(role) {
    if (role === 'Owner') return '👑 Owner';
    if (role === 'Admin') return '⚡ Admin';
    if (role === 'Moderator') return '🛡️ Moderator';
    if (role === 'IDs-Manager') return '🎵 IDs-Manager';
    return role;
}

async function versucheLogin() {
    const userIn = document.getElementById('login-username').value.trim();
    const passIn = document.getElementById('login-password').value.trim();
    const errorDiv = document.getElementById('login-error');

    if (!userIn || !passIn) {
        errorDiv.innerText = "Bitte Daten eingeben!";
        return;
    }
    
    errorDiv.innerText = "Verbindung zum Bunker wird aufgebaut...";
    errorDiv.style.color = "white";

    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/team_users?username=eq.${userIn}&select=*`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        
        const data = await res.json();

        // DIAGNOSE: Falls Supabase einen Fehlercode (z.B. falscher Key oder falsche Tabelle) sendet
        if (data && data.message) {
            errorDiv.style.color = "#ff3333";
            errorDiv.innerText = `Datenbank meldet: ${data.message} (${data.hint || 'Kein Hint'})`;
            return;
        }

        if (!Array.isArray(data) || data.length === 0 || data[0].password !== passIn) {
            errorDiv.style.color = "#ff3333";
            errorDiv.innerText = "Falscher Benutzername oder Passwort!";
        } else {
            currentUser = data[0];
            closeLoginModal();
            
            document.getElementById('display-user').innerHTML = `
                <span style="color: var(--tekk-yellow); font-size:13px; font-weight:bold; margin-right:12px;">
                    ${formatRole(currentUser.role)} | ${currentUser.username}
                </span>
                <button class="user-btn-badge" style="color: #ff3333; border-color: #441111; background:#111;" onclick="logout()">Logout</button>
            `;
            
            document.getElementById('guest-info-text').style.display = 'none';
            document.getElementById('secret-upload-fields').style.display = 'block';

            if (currentUser.role === 'Owner' || currentUser.role === 'Admin') {
                if(document.getElementById('admin-only-content')) document.getElementById('admin-only-content').style.display = 'block';
                if(document.getElementById('admin-lock-text')) document.getElementById('admin-lock-text').style.display = 'none';
                ladeTeam();
            }
        }
    } catch (err) {
        // DIAGNOSE: Falls das Skript komplett abstürzt (z.B. URL falsch)
        errorDiv.style.color = "#ff3333";
        errorDiv.innerText = "Kritischer Verbindungsfehler: " + err.message;
    }
}

function logout() {
    currentUser = null;
    document.getElementById('display-user').innerHTML = `
        <button class="user-btn-badge" onclick="openLoginModal()">🔑 Login</button>
    `;
    document.getElementById('guest-info-text').style.display = 'block';
    document.getElementById('secret-upload-fields').style.display = 'none';
    
    if(document.getElementById('admin-only-content')) document.getElementById('admin-only-content').style.display = 'none';
    if(document.getElementById('admin-lock-text')) document.getElementById('admin-lock-text').style.display = 'block';
    
    switchTab('home');
}

function switchTab(tabId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-tabs button').forEach(b => b.classList.remove('active'));
    
    document.getElementById('page-' + tabId).classList.add('active');
    document.getElementById('tab-' + tabId).classList.add('active');
    
    if (tabId === 'home') ladePlaylist();
    if (tabId === 'team' && currentUser) ladeTeam();
}

async function ladePlaylist() {
    const tbody = document.getElementById('playlist-body');
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/playlist?order=id.desc`, { 
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } 
        });
        const data = await res.json();
        tbody.innerHTML = '';
        
        if (Array.isArray(data)) {
            document.getElementById('songs-counter').innerText = data.length;
        } else {
            document.getElementById('songs-counter').innerText = "0";
        }

        let index = 1;
        data.forEach(song => {
            let kat = song.role && song.role.includes('(') ? song.role.split('(')[1].replace(')', '') : 'Tekk';
            tbody.innerHTML += `
                <tr>
                    <td>${index++}</td>
                    <td style="font-weight:bold; color:white;">${song.artist} - ${song.title}</td>
                    <td><span class="id-badge">${song.audio_id}</span></td>
                    <td><span class="category-badge">${kat}</span></td>
                </tr>`;
        });
    } catch (e) { 
        tbody.innerHTML = '<tr><td colspan="4">Fehler beim Laden der Playlist.</td></tr>'; 
    }
}

async function uploadTrack() {
    if (!currentUser) return;
    const artist = document.getElementById('up-artist').value;
    const title = document.getElementById('up-title').value;
    const audioId = document.getElementById('up-id').value;
    const statusDiv = document.getElementById('upload-status');
    
    if (!artist || !title || !audioId) { 
        statusDiv.style.color = "#ff3333"; 
        statusDiv.innerText = "Alle Felder ausfüllen!"; 
        return; 
    }

    statusDiv.style.color = "white"; 
    statusDiv.innerText = "Speichere im Bunker...";
    const uploaderInfo = `${currentUser.username} (${currentUser.role})`;

    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/playlist`, {
            method: 'POST',
            headers: { 
                'apikey': SUPABASE_KEY, 
                'Authorization': `Bearer ${SUPABASE_KEY}`, 
                'Content-Type': 'application/json', 
                'Prefer': 'return=minimal' 
            },
            body: JSON.stringify({ role: uploaderInfo, artist: artist, title: title, audio_id: audioId })
        });
        if (res.ok) {
            statusDiv.style.color = "#00ff66"; 
            statusDiv.innerText = "Erfolgreich! Track ist live.";
            document.getElementById('up-artist').value = ''; 
            document.getElementById('up-title').value = ''; 
            document.getElementById('up-id').value = '';
            ladePlaylist();
        }
    } catch (e) { 
        statusDiv.style.color = "#ff3333"; 
        statusDiv.innerText = "Fehler beim Hochladen."; 
    }
}

async function ladeTeam() {
    const tbody = document.getElementById('team-body');
    if(!tbody) return;
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/team_users?order=role.asc`, { 
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } 
        });
        const data = await res.json();
        tbody.innerHTML = '';
        data.forEach(user => {
            let actionBtn = user.role !== 'Owner' ? `<button class="btn-outline" style="color:#ff3333;" onclick="deleteUser(${user.id}, '${user.username}')">Löschen</button>` : '';
            tbody.innerHTML += `<tr><td style="font-weight:bold; color:white;">${user.username}</td><td>${formatRole(user.role)}</td><td>${actionBtn}</td></tr>`;
        });
    } catch (e) {}
}

async function createNewUser() {
    const name = document.getElementById('new-user-name').value;
    const pass = document.getElementById('new-user-pass').value;
    const role = document.getElementById('new-user-role').value;
    if (!name || !pass) return;
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/team_users`, {
            method: 'POST',
            headers: { 
                'apikey': SUPABASE_KEY, 
                'Authorization': `Bearer ${SUPABASE_KEY}`, 
                'Content-Type': 'application/json', 
                'Prefer': 'return=minimal' 
            },
            body: JSON.stringify({ username: name, password: pass, role: role })
        });
        document.getElementById('new-user-name').value = ''; 
        document.getElementById('new-user-pass').value = ''; 
        ladeTeam();
    } catch (e) {}
}

async function deleteUser(id, name) {
    if (!confirm(`Account '${name}' löschen?`)) return;
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/team_users?id=eq.${id}`, { 
            method: 'DELETE', 
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } 
        });
        ladeTeam();
    } catch (e) {}
}
