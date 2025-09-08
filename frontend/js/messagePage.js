document.getElementById('messagesLink').addEventListener('click', function(e) {
  e.preventDefault(); 

  document.body.innerHTML = ''; 

  // ===== כותרת הדף =====
  const header = document.createElement('h2');
  header.textContent = 'Messages';
  header.style.margin = '20px';
  document.body.appendChild(header);

  // ===== קונטיינר עיקרי =====
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.height = '80vh';
  container.style.margin = '20px';
  document.body.appendChild(container);

  // ===== Sidebar =====
  const sidebar = document.createElement('div');
  sidebar.style.width = '250px';
  sidebar.style.borderRight = '1px solid #dbdbdb';
  sidebar.style.padding = '10px';
  sidebar.style.overflowY = 'auto';
  container.appendChild(sidebar);

  // ===== Back Button =====
  const backBtn = document.createElement('button');
  backBtn.textContent = '← Back';
  backBtn.style.marginBottom = '15px';
  backBtn.style.padding = '5px 10px';
  backBtn.style.cursor = 'pointer';
  backBtn.addEventListener('click', () => window.history.back());
  sidebar.appendChild(backBtn);

  // ===== חברים =====
  const friends = [
    { name: 'Dr.KingPaul1010', img: '../assets/Photos/ChatGPT Image prfl5.png' },
    { name: 'Ron.Drin7', img: '../assets/Photos/ChatGPT Image prfl6.png' },
    { name: 'unrealNews', img: '../assets/Photos/ChatGPT Image prfl3.png' },
    { name: 'Sultan29', img: '../assets/Photos/ChatGPT Image prfl2.png' },
    { name: 'noam11010', img: '../assets/Photos/ChatGPT Image prfl1.png' },
    { name: 'I.D.F', img: '../assets/Photos/IDF Logo.png' },
    { name: 'itzik123213', img: '../assets/Photos/ChatGPT Image prfl7.png' },
    { name: 'AlexM', img: '../assets/Photos/ChatGPT Image post3.png' },
    { name: 'MayaK', img: '../assets/Photos/defaultPrfl.png' },
    { name: 'SamL', img: '../assets/Photos/ChatGPT Image post4.png' },
    { name: 'LilyR', img: '../assets/Photos/ChatGPT Image post1.png' },
    { name: 'NoamB', img: '../assets/Photos/ChatGPT Image post5.png' }
  ];

  const friendDivs = [];
  friends.forEach(friend => {
    const f = document.createElement('div');
    f.className = 'friend';
    f.style.display = 'flex';
    f.style.alignItems = 'center';
    f.style.cursor = 'pointer';
    f.style.marginBottom = '8px';

    const img = document.createElement('img');
    img.src = friend.img;
    img.style.width = '35px';
    img.style.height = '35px';
    img.style.borderRadius = '50%';
    img.style.marginRight = '10px';
    f.appendChild(img);

    const p = document.createElement('p');
    p.textContent = friend.name;
    p.style.margin = '0';
    f.appendChild(p);

    sidebar.appendChild(f);
    friendDivs.push({ div: f, name: friend.name });
  });

  // ===== כותרת קבוצות =====
  const groupTitle = document.createElement('h3');
  groupTitle.textContent = 'Groups';
  groupTitle.style.marginTop = '20px';
  sidebar.appendChild(groupTitle);

  let groups = ['Family', 'Work', 'Friends']; 
  const groupDivs = [];
  groups.forEach(group => {
    const g = document.createElement('div');
    g.className = 'group';
    g.textContent = group;
    g.style.cursor = 'pointer';
    g.style.padding = '5px 0';
    g.style.fontWeight = 'bold';
    sidebar.appendChild(g);
    groupDivs.push({ div: g, name: group });
  });

  // ===== Popup ליצירת קבוצה חדשה =====
  const popup = document.createElement('div');
  popup.id = 'groupPopup';
  popup.style.position = 'fixed';
  popup.style.top = '0';
  popup.style.left = '0';
  popup.style.width = '100%';
  popup.style.height = '100%';
  popup.style.backgroundColor = 'rgba(0,0,0,0.5)';
  popup.style.display = 'none';
  popup.style.justifyContent = 'center';
  popup.style.alignItems = 'center';

  const popupContent = document.createElement('div');
  popupContent.style.backgroundColor = '#fff';
  popupContent.style.padding = '20px';
  popupContent.style.borderRadius = '8px';
  popupContent.style.minWidth = '250px';
  popupContent.style.display = 'flex';
  popupContent.style.flexDirection = 'column';
  popupContent.style.gap = '10px';

  const groupInput = document.createElement('input');
  groupInput.placeholder = 'Enter group name...';
  groupInput.style.padding = '8px';
  groupInput.style.borderRadius = '4px';
  groupInput.style.border = '1px solid #ccc';
  popupContent.appendChild(groupInput);

  const createBtn = document.createElement('button');
  createBtn.textContent = 'Create';
  createBtn.style.backgroundColor = '#0095f6';
  createBtn.style.color = '#fff';
  createBtn.style.border = 'none';
  createBtn.style.padding = '8px';
  createBtn.style.borderRadius = '4px';
  createBtn.style.cursor = 'pointer';
  popupContent.appendChild(createBtn);

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.style.padding = '8px';
  cancelBtn.style.cursor = 'pointer';
  popupContent.appendChild(cancelBtn);

  popup.appendChild(popupContent);
  document.body.appendChild(popup);

  // ===== Create Group Button =====
  const createGroupBtn = document.createElement('button');
  createGroupBtn.textContent = 'Create New Group';
  createGroupBtn.className = 'createGroupBtn';
  createGroupBtn.style.marginTop = '10px';
  sidebar.appendChild(createGroupBtn);

  createGroupBtn.addEventListener('click', () => {
    popup.style.display = 'flex';
    groupInput.value = '';
  });

  cancelBtn.addEventListener('click', () => {
    popup.style.display = 'none';
  });

  createBtn.addEventListener('click', () => {
    const name = groupInput.value.trim();
    if(!name) return;

    const newGroupDiv = document.createElement('div');
    newGroupDiv.className = 'group';
    newGroupDiv.textContent = name;
    newGroupDiv.style.cursor = 'pointer';
    newGroupDiv.style.padding = '5px 0';
    newGroupDiv.style.fontWeight = 'bold';
    sidebar.appendChild(newGroupDiv);

    groups.push(name);
    groupDivs.push({ div: newGroupDiv, name });

    newGroupDiv.addEventListener('click', () => {
      activeChat = name;
      chatHeader.textContent = name;
      renderChat(activeChat);
    });

    popup.style.display = 'none';
  });

  // ===== Chat Window =====
  const chatWindow = document.createElement('div');
  chatWindow.id = 'chatWindow';
  chatWindow.style.flex = '1';
  chatWindow.style.display = 'flex';
  chatWindow.style.flexDirection = 'column';
  chatWindow.style.border = '1px solid #dbdbdb';
  chatWindow.style.borderRadius = '8px';
  chatWindow.style.marginLeft = '10px';
  container.appendChild(chatWindow);

  const chatHeader = document.createElement('div');
  chatHeader.id = 'chatHeader';
  chatHeader.style.padding = '10px';
  chatHeader.style.borderBottom = '1px solid #dbdbdb';
  chatHeader.style.fontWeight = 'bold';
  chatWindow.appendChild(chatHeader);

  const chatMessages = document.createElement('div');
  chatMessages.id = 'chatMessages';
  chatMessages.style.flex = '1';
  chatMessages.style.padding = '10px';
  chatMessages.style.overflowY = 'auto';
  chatMessages.style.backgroundColor = '#fafafa';
  chatWindow.appendChild(chatMessages);

  const chatInputDiv = document.createElement('div');
  chatInputDiv.id = 'chatInputDiv';
  chatInputDiv.style.display = 'flex';
  chatInputDiv.style.padding = '10px';
  chatInputDiv.style.borderTop = '1px solid #dbdbdb';
  chatWindow.appendChild(chatInputDiv);

  const chatInput = document.createElement('input');
  chatInput.type = 'text';
  chatInput.placeholder = 'Type a message...';
  chatInput.style.flex = '1';
  chatInput.style.padding = '8px 12px';
  chatInput.style.borderRadius = '20px';
  chatInput.style.border = '1px solid #ccc';
  chatInput.style.outline = 'none';
  chatInputDiv.appendChild(chatInput);

  const sendBtn = document.createElement('button');
  sendBtn.textContent = 'Send';
  sendBtn.style.marginLeft = '10px';
  sendBtn.style.padding = '8px 15px';
  sendBtn.style.border = 'none';
  sendBtn.style.backgroundColor = '#0095f6';
  sendBtn.style.color = '#fff';
  sendBtn.style.borderRadius = '20px';
  sendBtn.style.cursor = 'pointer';
  chatInputDiv.appendChild(sendBtn);

  // ===== Chat Logic =====
  let activeChat = null;
  let chats = {};

  function renderChat(name) {
    chatMessages.innerHTML = '';
    if(!chats[name]) return;
    chats[name].forEach(msg => {
      const msgDiv = document.createElement('div');
      msgDiv.textContent = msg.text;
      msgDiv.className = msg.type === 'personal' ? 'message personal' : 'message friend';
      chatMessages.appendChild(msgDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
  }

  friendDivs.forEach(f => {
    f.div.addEventListener('click', () => {
      activeChat = f.name;
      chatHeader.textContent = f.name;
      renderChat(activeChat);
    });
  });

  groupDivs.forEach(g => {
    g.div.addEventListener('click', () => {
      activeChat = g.name;
      chatHeader.textContent = g.name;
      renderChat(activeChat);
    });
  });

  sendBtn.addEventListener('click', () => {
    const text = chatInput.value.trim();
    if(!text || !activeChat) return;
    if(!chats[activeChat]) chats[activeChat] = [];
    chats[activeChat].push({ type: 'personal', text });
    renderChat(activeChat);
    chatInput.value = '';
  });

  chatInput.addEventListener('keypress', e => {
    if(e.key === 'Enter') sendBtn.click();
  });

});
