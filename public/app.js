 const firebaseConfig = {                                                                               
      apiKey: "AIzaSyBLDQ1rbchr7hOmMFrzof3q49l3BAXnPDg",                                                                            
      authDomain: "daily-challenge-app-b00d7.firebaseapp.com",                                                     
      projectId: "daily-challenge-app-b00d7",                                                                      
      storageBucket: "daily-challenge-app-b00d7.firebasestorage.app",                                                      
      messagingSenderId: "1056866521507",                                                               
      appId: "1:1056866521507:web:667173f49457bf739e4a16"                                                                               
  };                                                                                                     
                                                                                                         
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();                                                                          
  const db = firebase.firestore();

  let currentUser = null;
  let sessionData = null;                                                                                
  let currentIndex = 0;                                                                                  
  let answers = [];
  let correctAnswers = [];  

// ─── Rotating Hero Words ─────────────────────────────────────────────────────
const heroWords = ['Daily.', 'Sharp.', 'Earned.', 'Yours.', 'Now.'];
let heroWordIndex = 0;

function rotateHeroWord() {
    const el = document.getElementById('rotating-word');
    if (!el) return;

    el.classList.remove('slide-in');
    el.classList.add('slide-out');

    setTimeout(() => {
        heroWordIndex = (heroWordIndex + 1) % heroWords.length;
        el.textContent = heroWords[heroWordIndex];
        el.classList.remove('slide-out');
        el.classList.add('slide-in');
    }, 360);
}

// ─── Auth ────────────────────────────────────────────────────────────────────
 // Check auth state
  function checkAuth() {
      auth.onAuthStateChanged((user) => {
          if (user) {                                                                                    
              currentUser = user;
              showApp();                                                                                 
          }       
      });                                                                                                
  } 

// Sign up                                                                                             
  async function signup() {
      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;                                 
                                                                                                         
      if (!email || !password) {                                                                         
          showToast('Please enter email and password', 'error');                                         
          return;                                                                                        
      }           
                                                                                                         
      try {                                                                                              
          const userCredential = await auth.createUserWithEmailAndPassword(email, password);
          showToast('Account created! Check your email for verification.', 'success');                   
      } catch (error) {                                                                                  
          showToast(error.message, 'error');                                                             
      }                                                                                                  
  }  

// Login
  async function login() {
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;                                  
                                                                                                         
      if (!email || !password) {                                                                         
          showToast('Please enter email and password', 'error');                                         
          return;                                                                                        
      }           

      try {
          const userCredential = await auth.signInWithEmailAndPassword(email, password);
          currentUser = userCredential.user;                                                             
          showApp();                                                                                     
      } catch (error) {                                                                                  
          showToast(error.message, 'error');                                                             
      }                                                                                                  
  }  

 // Logout
  async function logout() {
      await auth.signOut();
      currentUser = null;
      location.reload();
  }

// ─── App State ───────────────────────────────────────────────────────────────
async function showApp() {
    document.getElementById('auth-forms').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('logout-btn').classList.remove('hidden');
    document.getElementById('difficulty-selector').classList.remove('hidden');
    document.getElementById('user-email').textContent = currentUser.email;
    console.log('Firebase user:', currentUser);                                                        
    console.log('currentUser.id:', currentUser.id);                                                    
    console.log('currentUser.uid:', currentUser.uid);
    await loadSession();
}

async function loadSession() {
    try {
        const res = await fetch('/api/session/' + currentUser.uid);
        if (!res.ok) throw new Error('No session');
        sessionData = await res.json();

        answers        = new Array(sessionData.total).fill(null);
        correctAnswers = new Array(sessionData.total).fill(null);
        currentIndex   = 0;

        document.getElementById('progress-total').textContent = sessionData.total;
        showQuestion(currentIndex);
        updateProgress();

    } catch (e) {
        document.getElementById('question-area').innerHTML =
            `<div class="results-card">
                <h2>😴 No questions today</h2>
                <p style="color:var(--text-2); margin-top: 8px;">Check back tomorrow for a new challenge.</p>
             </div>`;
    }
}

// ─── Question Display ─────────────────────────────────────────────────────────
function showQuestion(index) {
    const q       = sessionData.questions[index];
    const letters = ['A', 'B', 'C', 'D'];

    let html = '<div class="question-card">';
    html += '<h3>' + q.question_text + '</h3>';
    html += '<div class="options">';

    for (let i = 0; i < q.options.length; i++) {
        html += `<button class="option-btn" onclick="submitAnswer('${letters[i]}')">
                    <span style="font-weight:700;color:var(--primary);font-family:var(--font-display);min-width:20px">${letters[i]}</span>
                    ${q.options[i]}
                 </button>`;
    }

    html += '</div>';
    html += '<div id="result"></div>';
    html += '</div>';

    document.getElementById('question-area').innerHTML = html;
}

// ─── Progress ─────────────────────────────────────────────────────────────────
function updateProgress() {
    const current = currentIndex + 1;
    const total   = sessionData.total;

    const labelEl = document.getElementById('progress-current');
    if (labelEl) labelEl.textContent = current;

    const fill = document.getElementById('progress-fill');
    if (fill) fill.style.width = ((current / total) * 100) + '%';

    const scoreEl = document.getElementById('score');
    const correct = correctAnswers.filter(a => a === true).length;
    if (scoreEl) scoreEl.textContent = currentIndex > 0 ? correct + '/' + currentIndex : '—';
}

// ─── Submit Answer ────────────────────────────────────────────────────────────
async function submitAnswer(answer) {
    const q = sessionData.questions[currentIndex];

    // Disable all buttons
    document.querySelectorAll('.option-btn').forEach(btn => btn.disabled = true);

    // Highlight selected button
    document.querySelectorAll('.option-btn').forEach(btn => {
        const letter = btn.querySelector('span')?.textContent?.trim();
        if (letter === answer) btn.style.borderColor = 'var(--primary)';
    });

    // Submit to server
    const res = await fetch('/api/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
            user_id: currentUser.uid,      
            question_id:     q.id,
            selected_answer: answer
        })
    });

    const result = await res.json();

    // Store result
    answers[currentIndex]        = answer;
    correctAnswers[currentIndex] = result.correct;
  
    // Style correct / incorrect button
    document.querySelectorAll('.option-btn').forEach(btn => {
        const letter = btn.querySelector('span')?.textContent?.trim();
        if (letter === answer) {
            btn.classList.add(result.correct ? 'correct' : 'incorrect');
        }
    });

    // Show feedback
    const resultDiv = document.getElementById('result');
    if (result.correct) {
        resultDiv.innerHTML = '<div class="result correct">✅ Correct!</div>';
    } else {
        resultDiv.innerHTML = `<div class="result incorrect">❌ The answer was: ${result.correct_answer}</div>`;
    }

    // Advance after 1.5 s
    setTimeout(() => {
        currentIndex++;
        updateProgress();
        if (currentIndex < sessionData.total) {
            showQuestion(currentIndex);
        } else {
            showResults();
        }
    }, 1500);
}

// ─── Results Screen ───────────────────────────────────────────────────────────
function showResults() {
    const correct  = correctAnswers.filter(a => a === true).length;
    const total    = sessionData.total;
    const accuracy = Math.round((correct / total) * 100);

    // Update progress fill to 100%
    const fill = document.getElementById('progress-fill');
    if (fill) fill.style.width = '100%';

    let emoji = accuracy === 100 ? '🏆' : accuracy >= 70 ? '🎉' : accuracy >= 40 ? '💪' : '😅';

    let html = `<div class="results-card">
        <h2>${emoji} Challenge Complete!</h2>
        <div class="score-display">${correct}/${total}</div>
        <div class="accuracy-display">${accuracy}% accuracy</div>
        <div class="breakdown">`;

    for (let i = 0; i < total; i++) {
        html += correctAnswers[i] ? '✅' : '❌';
    }

    html += `</div>
        <button class="share-btn" onclick="shareResults()">📋 Copy Results</button>
    </div>`;

    document.getElementById('question-area').innerHTML = html;
}

// ─── Share Results ─────────────────────────────────────────────────────────────
function shareResults() {
    const correct = correctAnswers.filter(a => a === true).length;
    const total   = sessionData.total;
    const date    = sessionData.date;

    let shareText = `Daily Challenge ${date}: ${correct}/${total}\n`;
    shareText    += correctAnswers.map(a => a ? '✅' : '❌').join('');

    navigator.clipboard.writeText(shareText).then(() => {
        showToast('Results copied to clipboard! 📋', 'success');
    });
}
 // Google Sign In                                                                                      
  async function googleSignIn() {                                                                        
      const provider = new firebase.auth.GoogleAuthProvider();                                           
                                                                                                         
      try {                                                                                              
          const result = await auth.signInWithPopup(provider);                                           
          currentUser = result.user;                                                                     
          showToast('Welcome, ' + currentUser.displayName + '!', 'success');                             
          showApp();                                                                                     
      } catch (error) {                                                                                  
          showToast(error.message, 'error');                                                             
          console.error('Google sign-in error:', error);                                                 
      }                                                                                                  
  }     
   // Alternative: Redirect method (better for mobile)                                                    
  async function googleSignInRedirect() {                                                                
      const provider = new firebase.auth.GoogleAuthProvider();                                           
      await auth.signInWithRedirect(provider);                                                           
  }                                                                                                      
                                                                                                         
  // Then add this to check redirect result on load:                                                     
  auth.getRedirectResult().then((result) => {                                                            
      if (result.user) {                                                                                 
          currentUser = result.user;                                                                     
          showApp();                                                                                     
      }                                                                                                  
  }).catch((error) => {                                                                                  
      console.error('Redirect error:', error);                                                           
  });                          

// ─── Toast Notifications ──────────────────────────────────────────────────────
function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    const color = type === 'error' ? 'var(--danger)' : 'var(--accent)';
    const bg    = type === 'error' ? 'rgba(248,113,113,0.12)' : 'rgba(52,211,153,0.12)';

    Object.assign(toast.style, {
        position:     'fixed',
        bottom:       '28px',
        left:         '50%',
        transform:    'translateX(-50%) translateY(12px)',
        background:   bg,
        border:       `1px solid ${color}`,
        color:        color,
        padding:      '12px 24px',
        borderRadius: '99px',
        fontFamily:   'var(--font-body)',
        fontSize:     '0.9rem',
        fontWeight:   '500',
        zIndex:       '9999',
        opacity:      '0',
        transition:   'all 0.3s cubic-bezier(0.4,0,0.2,1)',
        whiteSpace:   'nowrap',
        boxShadow:    '0 8px 32px rgba(0,0,0,0.4)',
    });

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity   = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
        toast.style.opacity   = '0';
        toast.style.transform = 'translateX(-50%) translateY(12px)';
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('logout-btn')?.addEventListener('click', logout);

    // Start hero word rotation
    setInterval(rotateHeroWord, 2200);

    // Allow Enter key on auth inputs
    ['login-password', 'signup-password'].forEach(id => {
        document.getElementById(id)?.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                if (id.startsWith('login')) login();
                else signup();
            }
        });
    });

    checkAuth();
});
