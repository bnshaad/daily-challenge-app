  console.log('=== SERVER STARTING ===');    
 require('dotenv').config();                                                                            
  const express = require('express');                                                                    
  const { createClient } = require('@supabase/supabase-js');
                                                                                                         
  const app = express();
  const PORT = process.env.PORT || 3000;                                                                 
                                                                                                         
  app.use(express.json());  
  app.use(express.static('../public'));                                                                              
                                                                                                         
  // Supabase setup                                                                                      
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;                                                     
                                                                                                         
  if (!supabaseUrl || !supabaseKey) {                                                                    
      console.error('Missing Supabase credentials');                                                     
      process.exit(1);                                                                                   
  }                                                                                                      
                                                                                                         
  const supabase = createClient(supabaseUrl, supabaseKey);                                               
                                                                                                         
                  
                                                                                                       
  // Root route                                                                                          
  app.get('/', (req, res) => {
      res.send('Daily Challenge App - Server is running!');                                              
  });                                                                                                    
                                                                                                         
  // GET /api/question - Get today's question                                                            
  app.get('/api/question', async (req, res) => {                                                         
      const today = new Date().toLocaleDateString('en-CA');                                              
      const difficulty = req.query.difficulty || 'medium';                                               
                                                                                                         
      console.log('Searching for:', { today, difficulty }); // ADD THIS                                  
                                                                                                         
      const { data, error } = await supabase                                                             
          .from('questions')
          .select('id, question_text, options, date, difficulty')                                        
          .eq('date', today)                                                                             
          .eq('difficulty', difficulty)                                                                  
          .limit(1);                                                                                     
                                                                                                         
      console.log('Result:', { data, error }); // ADD THIS                                               
                                                                                                         
      if (error || !data || data.length === 0) {                                                         
          return res.status(404).json({ error: 'No question found for today' });
      }                                                                                                  
                                                                                                         
      res.json(data[0]);                                                                                 
  });


   // POST /api/submit - Submit an answer
  app.post('/api/submit', async (req, res) => {                                                          
      const { user_id, question_id, selected_answer } = req.body;                                        
                                                                                                         
      // Validate input                                                                                  
      if (!user_id || !question_id || !selected_answer) {                                                
          return res.status(400).json({                                                                  
              error: 'Missing required fields: user_id, question_id, selected_answer'                    
          });                                                                                            
      }                                                                                                  
                                                                                                         
      // Get the correct answer from database                                                            
      const { data: question, error: questionError } = await supabase                                    
          .from('questions')                                                                             
          .select('correct_answer')
          .eq('id', question_id)                                                                         
          .single();                                                                                     
                                                                                                         
      if (questionError || !question) {                                                                  
          return res.status(404).json({ error: 'Question not found' });                                  
      }                                                                                                  
                                                                                                         
      // Check if answer is correct                                                                      
      const is_correct = selected_answer === question.correct_answer;                                    
                                                                                                         
      // Store the submission                                                                            
      const { data: submission, error: submitError } = await supabase                                    
          .from('submissions')                                                                           
          .insert({
              user_id,                                                                                   
              question_id,                                                                               
              selected_answer,                                                                           
              is_correct                                                                                 
          })                                                                                             
          .select()
          .single();                                                                                     
                                                                                                         
      if (submitError) {                                                                                 
          return res.status(500).json({ error: submitError.message });                                   
      }                                                                                                  
                                                                                                         
      // Return result                                                                                   
       res.json({                                                                                             
      correct: is_correct,
      your_answer: selected_answer,                                                                      
      submission_id: submission.id                                                                       
  });                                                                                                
  }); 
                                         
    // GET /api/score/:userId - Get user's score                                                           
  app.get('/api/score/:userId', async (req, res) => {                                                    
      const { userId } = req.params;                                                                     
                                                                                                         
      const { data: submissions, error } = await supabase                                                
          .from('submissions')
          .select('is_correct')                                                                          
          .eq('user_id', userId);                                                                        
                                                                                                         
      if (error) {                                                                                       
          return res.status(500).json({ error: error.message });                                         
      }                                                                                                  
                  
      const total = submissions.length;                                                                  
      const correct = submissions.filter(s => s.is_correct).length;
                                                                                                         
      res.json({  
          user_id: userId,                                                                               
          total_submissions: total,
          correct_answers: correct,
          accuracy: total > 0 ? Math.round((correct / total) * 100) + '%' : 'N/A'
      });                                                                                                
  });
  app.get('/api/history/:userId', async (req, res) => {                                                  
      const { userId } = req.params;                                                                     
                                                                                                         
      const { data, error } = await supabase                                                             
          .from('submissions')                                                                           
          .select('*, questions(question_text, correct_answer)')                                         
          .eq('user_id', userId)                                                                         
          .order('submitted_at', { ascending: false });                                                  
                                                                                                         
      if (error) return res.status(500).json({ error: error.message });                                  
      res.json(data);                                                                                    
  });
 app.get('/api/leaderboard', async (req, res) => {                                                      
      const { data, error } = await supabase       
          .from('submissions')                                                                           
          .select('user_id, is_correct');                                                                
                                                                                                         
      if (error) return res.status(500).json({ error: error.message });                                  
                                                                                                         
      // Calculate scores                                                                                
      const scores = {};                                                                                 
      data.forEach(sub => {
          if (!scores[sub.user_id]) scores[sub.user_id] = { correct: 0, total: 0 };                      
          scores[sub.user_id].total++;                                                                   
          if (sub.is_correct) scores[sub.user_id].correct++;                                             
      });                                                                                                
                                                                                                         
      // Sort and return top 10                                                                          
      const sorted = Object.entries(scores)                                                              
          .map(([user_id, s]) => ({ user_id, ...s }))
          .sort((a, b) => b.correct - a.correct)                                                         
          .slice(0, 10);                                                                                 
                                                                                                         
      res.json(sorted);                                                                                  
  });
  // GET /api/session/:userId - Get 10 shuffled questions for today                                      
  // Deterministic shuffle based on seed (userId + date)                                                 
  function seededShuffle(array, seed) {                                                                  
      let currentIndex = array.length;                                                                   
      let temporaryValue, randomIndex;                                                                   
                                                                                                         
      let seedNumber = 0;                                                                                
      for (let i = 0; i < seed.length; i++) {                                                            
          seedNumber += seed.charCodeAt(i);                                                              
      }                                                                                                  
                                                                                                         
      const arr = [...array];                                                                            
                                                                                                         
      while (0 !== currentIndex) {                                                                       
          seedNumber = (seedNumber * 9301 + 49297) % 233280;
          const random = seedNumber / 233280;                                                            
                                                                                                         
          randomIndex = Math.floor(random * currentIndex);                                               
          currentIndex -= 1;                                                                             
                                                                                                         
          temporaryValue = arr[currentIndex];                                                            
          arr[currentIndex] = arr[randomIndex];                                                          
          arr[randomIndex] = temporaryValue;                                                             
      }                                                                                                  
                                                                                                         
      return arr;                                                                                        
  }                                                                                                      
                                                                                                         
  // GET /api/session/:userId - Get 10 shuffled questions for today                                      
  app.get('/api/session/:userId', async (req, res) => {
      const { userId } = req.params;                                                                     
      const today = new Date().toISOString().split('T')[0];                                              
      const seed = userId + today;                                                                       
                                                                                                         
      const { data: questions, error } = await supabase                                                  
          .from('questions')                                                                             
          .select('id, question_text, options, difficulty, correct_answer')                              
          .eq('date', today);                                                                            
                                                                                                         
      if (error || !questions || questions.length === 0) {                                               
          return res.status(404).json({ error: 'No questions found for today' });                        
      }                                                                                                  
                  
      const shuffled = seededShuffle(questions, seed);                                                   
                  
      res.json({                                                                                         
          date: today,
          questions: shuffled,
          total: shuffled.length
      });                                                                                                
  });                                          
                                                                                              
  // Start server                                                                                        
  app.listen(PORT, () => {                                                                               
      console.log('Server running at http://localhost:' + PORT);                                         
  });                                  