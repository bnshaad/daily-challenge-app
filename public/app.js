// Supabase setup                                                                                      
  const SUPABASE_URL = 'https://jsyupuywbtvaxvlwhzah.supabase.co';                                                         
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzeXVwdXl3YnR2YXh2bHdoemFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5ODc0MTAsImV4cCI6MjA5MTU2MzQxMH0.CnVLgMmluvNBz56HPx64FUFQ01fI42vFaAyPyTDoEWc';                                               
                                                                                                         
  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);                                     
                                                                                                         
  let currentUser = null;                                                                                
  let sessionData = null; // Stores all 10 questions
  let currentIndex = 0; // 0-9                                                                           
  let answers = []; // User's answers                                                                    
  let correctAnswers = []; // Track which were correct                                                   
                                                                                                         
  // Check if user is logged in                                                                          
  async function checkAuth() {                                                                           
      const { data: { session } } = await sb.auth.getSession();                                          
      if (session) {                                                                                     
          currentUser = session.user;                                                                    
          showApp();                                                                                     
      }                                                                                                  
  }                                                                                                      
                                                                                                         
  // Sign up      
  async function signup() {                                                                              
      const email = document.getElementById('signup-email').value;                                       
      const password = document.getElementById('signup-password').value;                                 
                                                                                                         
      if (!email || !password) {                                                                         
          alert('Please enter email and password');                                                      
          return;                                                                                        
      }           
                                                                                                         
      const { data, error } = await sb.auth.signUp({                                                     
          email: email,                                                                                  
          password: password                                                                             
      });                                                                                                
                                                                                                         
      if (error) {                                                                                       
          alert('Error: ' + error.message);
      } else {                                                                                           
          alert('Check your email for confirmation!');                                                   
      }                                                                                                  
  }                                                                                                      
                                                                                                         
  // Login                                                                                               
  async function login() {
      const email = document.getElementById('login-email').value;                                        
      const password = document.getElementById('login-password').value;                                  
                                                                                                         
      if (!email || !password) {                                                                         
          alert('Please enter email and password');
          return;                                                                                        
      }
                                                                                                         
      const { data, error } = await sb.auth.signInWithPassword({                                         
          email: email,
          password: password                                                                             
      });                                                                                                
                                                                                                         
      if (error) {                                                                                       
          alert('Error: ' + error.message);                                                              
      } else {                                                                                           
          currentUser = data.user;                                                                       
          showApp();                                                                                     
      }                                                                                                  
  }                                                                                                      
                                                                                                         
  // Logout                                                                                              
  async function logout() {
      await sb.auth.signOut();                                                                           
      currentUser = null;                                                                                
      location.reload();                                                                                 
  }                                                                                                      
                                                                                                         
  // Show app after login                                                                                
  async function showApp() {                                                                             
      document.getElementById('auth-forms').classList.add('hidden');                                     
      document.getElementById('app').classList.remove('hidden');                                         
      document.getElementById('logout-btn').classList.remove('hidden');                                  
      document.getElementById('difficulty-selector')?.classList.remove('hidden');                        
      document.getElementById('user-email').textContent = currentUser.email;                             
                                                                                                         
      // Load session with 10 questions                                                                  
      await loadSession();                                                                               
  }                                                                                                      
                  
  // Load session (10 questions)                                                                         
  async function loadSession() {
      try {                                                                                              
          const res = await fetch('/api/session/' + currentUser.id);
          if (!res.ok) throw new Error('No session');                                                    
          sessionData = await res.json();                                                                
                                                                                                         
          // Initialize answers array                                                                    
          answers = new Array(sessionData.total).fill(null);                                             
          correctAnswers = new Array(sessionData.total).fill(null);                                      
          currentIndex = 0;                                                                              
                                                                                                         
          showQuestion(currentIndex);                                                                    
          updateProgress();                                                                              
                                                                                                         
          // Hide results, show question area                                                            
          document.getElementById('results-screen')?.classList.add('hidden');                            
          document.getElementById('question-area')?.classList.remove('hidden');                          
                                                                                                         
      } catch (e) {                                                                                      
          document.getElementById('app').innerHTML = '<h3>No questions today! Check back tomorrow.</h3>';
      }                                                                                                  
  }               
                                                                                                         
  // Show specific question                                                                              
  function showQuestion(index) {
      const q = sessionData.questions[index];                                                            
      const letters = ['A', 'B', 'C', 'D'];                                                              
                                                                                                         
      let html = '<div class="question-card">';                                                          
      html += '<h3>' + q.question_text + '</h3>';                                                        
      html += '<div class="options">';                                                                   
                                                                                                         
      for (let i = 0; i < q.options.length; i++) {                                                       
          html += '<button class="option-btn" onclick="submitAnswer(\'' + letters[i] + '\')">';          
          html += letters[i] + ') ' + q.options[i];                                                      
          html += '</button>';                                                                           
      }                                                                                                  
                                                                                                         
      html += '</div>';                                                                                  
      html += '<div id="result"></div>';
      html += '</div>';                                                                                  
                                                                                                         
      document.getElementById('question-area').innerHTML = html;                                         
  }                                                                                                      
                                                                                                         
  // Update progress bar                                                                                 
  function updateProgress() {
      const progressDiv = document.getElementById('progress-bar');                                       
      if (progressDiv) {                                                                                 
          progressDiv.textContent = 'Question ' + (currentIndex + 1) + ' of ' + sessionData.total;       
      }                                                                                                  
  }                                                                                                      
                                                                                                         
  // Submit answer
  async function submitAnswer(answer) {
      const q = sessionData.questions[currentIndex];                                                     
                                                                                                         
      // Disable buttons                                                                                 
      document.querySelectorAll('.option-btn').forEach(btn => {                                          
          btn.disabled = true;                                                                           
      });                                                                                                
                                                                                                         
      // Submit to server                                                                                
      const res = await fetch('/api/submit', {                                                           
          method: 'POST',                                                                                
          headers: {'Content-Type': 'application/json'},                                                 
          body: JSON.stringify({                                                                         
              user_id: currentUser.id,                                                                   
              question_id: q.id,                                                                         
              selected_answer: answer                                                                    
          })                                                                                             
      });         

      const result = await res.json();

      // Store result                                                                                    
      answers[currentIndex] = answer;
      correctAnswers[currentIndex] = result.correct;                                                     
                                                                                                         
      // Show feedback                                                                                   
      const resultDiv = document.getElementById('result');                                               
      resultDiv.innerHTML = result.correct                                                               
          ? '<div class="result correct">✅ Correct!</div>'                                              
          : '<div class="result incorrect">❌ Wrong! Answer was ' + result.correct_answer + '</div>';    
                                                                                                         
      // Wait 1.5 seconds then advance or show results                                                   
      setTimeout(() => {                                                                                 
          currentIndex++;                                                                                
          if (currentIndex < sessionData.total) {
              showQuestion(currentIndex);                                                                
              updateProgress();
          } else {                                                                                       
              showResults();                                                                             
          }                                                                                              
      }, 1500);                                                                                          
  }                                                                                                      
                                                                                                         
  // Show final results                                                                                  
  function showResults() {                                                                               
      const correct = correctAnswers.filter(a => a === true).length;                                     
      const total = sessionData.total;                                                                   
      const accuracy = Math.round((correct / total) * 100);                                              
                                                                                                         
      // Hide question area, show results                                                                
      document.getElementById('question-area').innerHTML = '';                                           
                                                                                                         
      let resultsHtml = '<div id="results-screen" class="results-card">';                                
      resultsHtml += '<h2>🎉 Session Complete!</h2>';                                                    
      resultsHtml += '<div class="score-display">' + correct + '/' + total + '</div>';                   
      resultsHtml += '<div class="accuracy-display">' + accuracy + '% accuracy</div>';                   
                                                                                                         
      // Per-question breakdown                                                                          
      resultsHtml += '<div class="breakdown">';                                                          
      for (let i = 0; i < total; i++) {                                                                  
          resultsHtml += correctAnswers[i] ? '✅' : '❌';                                                
      }                                                                                                  
      resultsHtml += '</div>';                                                                           
                                                                                                         
      // Share button                                                                                    
      resultsHtml += '<button class="share-btn" onclick="shareResults()">📋 Share Results</button>';     
      resultsHtml += '</div>';                                                                           
                                                                                                         
      document.getElementById('question-area').innerHTML = resultsHtml;                                  
  }                                                                                                      
                                                                                                         
  // Share results (Wordle style)                                                                        
  function shareResults() {                                                                              
      const correct = correctAnswers.filter(a => a === true).length;                                     
      const total = sessionData.total;                                                                   
      const date = sessionData.date;                                                                     
                                                                                                         
      let shareText = 'Daily Challenge ' + date + ': ' + correct + '/' + total + ' ';                    
      shareText += correctAnswers.map(a => a ? '✅' : '❌').join('');                                    
                                                                                                         
      navigator.clipboard.writeText(shareText).then(() => {                                              
          alert('Results copied to clipboard!');                                                         
      });                                                                                                
  }               
                                                                                                         
  // Initialize                                                                                          
  document.addEventListener('DOMContentLoaded', function() {
      document.getElementById('logout-btn')?.addEventListener('click', logout);                          
      checkAuth();                                                                                       
  });            