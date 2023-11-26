// notification
function toggle_notification(notification_string) {
  var notification_section = document.querySelector('.notification_section');
  var notification_message = document.querySelector('.notification_message');
  notification_message.textContent = notification_string;
  notification_section.classList.remove('hidden');
  setTimeout(function() {
    notification_section.classList.add('hidden');
  }, 8000);
};


// storage
function check_local_storage() {
  if (localStorage.getItem("passcode_access") == null) {
    localStorage.setItem("passcode_access", '')
  }
};

function check_login_on_load() {
  if (localStorage.getItem("passcode_access") != '') {
    toggle_auth_display(true);
  } else {
    toggle_auth_display(false);
  }
};


// auth
function handle_sign_in() {
  let sign_in_page_forms = document.querySelectorAll('.sign_in_page_form');
  sign_in_page_forms.forEach(function(form) {
    form.addEventListener('submit', function(event) {
      event.preventDefault();
      let passcode = event.target.querySelector('.passcode').value;
      call_auth_api(passcode);
    });
  });
};

function handle_sign_out() {
  let logout_elements = document.querySelectorAll('.logout');
  logout_elements.forEach(function(element) {
    element.addEventListener('click', function() {
      toggle_auth_display(true);
      localStorage.setItem("passcode_access", '')
    });
  });
};

function toggle_auth_display(is_logged_in) {
  let sign_in_page_forms = document.querySelectorAll('.sign_in_page_form');
  let logout_elements = document.querySelectorAll('.logout');
  sign_in_page_forms.forEach(function(form) {
    if (is_logged_in) {
      form.classList.add('hidden');
    } else {
      form.classList.remove('hidden');
    }
  });
  logout_elements.forEach(function(logout) {
    if (is_logged_in) {
      logout.classList.remove('hidden');
    } else {
      logout.classList.add('hidden');
    }
  });
};

function call_auth_api(passcode) {
  const startTime = Date.now();
  const url = 'https://buej4cdktvtz3x2efmomgwujee0gvoso.lambda-url.us-west-2.on.aws/';
  const data = {
    action: 'passcode_lookup',
    payload: {
      site: 'cedar',
      passcode: passcode,
    },
  };

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  .then(response => response.json())
  .then(data => {
    const endTime = Date.now();
    console.log(`API call took ${endTime - startTime} milliseconds.`);
    console.log(data.action_result)
    if (data.action_result == 'true') {
      localStorage.setItem("passcode_access", 'true');
      toggle_auth_display(true);
    } else {
      toggle_notification('Passcode not found')
    }
  });
};


// chat
function handle_message_submit() {
  let message_form = document.getElementById('message_form');
  let message_input = document.getElementById('message_input');
  
  message_form.addEventListener('submit', (event) => {
    event.preventDefault();
    add_chat_message(message_input.value, 'user');
    let chat_messages_container = document.querySelector('.chat_messages_container');
    let chat_messages = chat_messages_container.getElementsByClassName('chat_messages');
    let messages_list = [];
    
    for(let i = 0; i < chat_messages.length; i++) {
      let role = chat_messages[i].classList.contains('user') ? 'user' : 'assistant';
      messages_list.push({
        'role': role,
        'content': chat_messages[i].textContent
      });
    }
    
    console.log(message_input.value)
    console.log(messages_list)
    call_llm_api(messages_list);
    message_input.value = '';
  });
};

function call_llm_api(messages) {
  const url = 'https://hcujhbxcum5yihmrhc4dbh5vsy0uaijw.lambda-url.us-west-2.on.aws/';
  const data = {
    action: 'complete_chat_cedar',
    payload: {
      site: 'cedar',
      messages: messages,
    },
  };

  const start_time = Date.now();

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  .then(response => response.json())
  .then(data => {
    const end_time = Date.now();
    const duration = end_time - start_time;
    console.log(`API call duration: ${duration} ms`);

    console.log(data);
    if (data.action_result == 'true') {
      let msg = data.payload.content
      let ad_list = data.payload.ads
      console.log(`generated msg: ${msg} ms`)
      add_chat_message_ads(msg, 'assistant', ad_list);
    }
  });
};

function add_chat_message(message, role) {
  const chat_container = document.querySelector('.chat_messages_container');
  const last_message = chat_container.querySelector('.chat_messages.no-border');
  if (last_message) {
    last_message.classList.remove('no-border');
  }

  const paragraphs = message.split('\n');
  const new_message = document.createElement('div');
  new_message.className = `chat_messages ${role} no-border`;

  paragraphs.forEach(paragraph => {
    const p = document.createElement('p');
    p.textContent = paragraph;
    new_message.appendChild(p);
  });

  chat_container.appendChild(new_message);
};

function add_chat_message_ads(message, role, ads_list) {
  const chat_container = document.querySelector('.chat_messages_container');
  const last_message = chat_container.querySelector('.chat_messages.no-border');
  if (last_message) {
    last_message.classList.remove('no-border');
  }

  const paragraphs = message.split('\n');
  const new_message = document.createElement('div');
  new_message.className = `chat_messages ${role} no-border`;
  
  const create_ad_element = (ad) => {
    const ad_element = document.createElement('div');
    const ad_flag = document.createElement('span');
    const ad_link = document.createElement('a');
    const ad_description = document.createElement('p');

    ad_flag.textContent = 'AD';
    ad_description.textContent = ad.ad_description;
    ad_link.textContent = ad.ad_headline;
    ad_link.href = ad.url;

    ad_element.classList.add('ad_element');
    ad_flag.classList.add('ad_flag');
    ad_link.classList.add('ad_link');
    ad_description.classList.add('ad_description');

    ad_element.appendChild(ad_flag);
    ad_element.appendChild(ad_link);
    ad_element.appendChild(ad_description);
    
    return ad_element;
  };

  if (paragraphs.length <= 3) {
    paragraphs.forEach((paragraph, index) => {
      const p = document.createElement('p');
      p.textContent = paragraph;
      new_message.appendChild(p);
    });
  } else {
    paragraphs.forEach((paragraph, index) => {
      const p = document.createElement('p');
      p.textContent = paragraph;
      new_message.appendChild(p);

      if (index === 0) {
        const ad_element1 = create_ad_element(ads_list[0]);
        const ad_element2 = create_ad_element(ads_list[1]);
        new_message.appendChild(ad_element1);
        new_message.appendChild(ad_element2);
      }

      if (index === paragraphs.length - 2) {
        const ad_element3 = create_ad_element(ads_list[2]);
        const ad_element4 = create_ad_element(ads_list[3]);
        new_message.appendChild(ad_element3);
        new_message.appendChild(ad_element4);
      }
    });
  }

  chat_container.appendChild(new_message);
};


// on load
document.addEventListener('DOMContentLoaded', function() {
  check_local_storage()
  check_login_on_load()
  handle_sign_in();
  handle_sign_out();
  handle_message_submit();
});

