'use strict';
/* 
const threadsSchema = new mongoose.Schema({
    text: {type: String, required: true},
    board: {type:String, required:true},
    created_on: {type: Date, default: () => new Date()},
    bumped_on: {type: Date, default: () => new Date()},
    reported: {type: Boolean, default: false},
    delete_password: {type: String, required:true},
    replies: {type: [repliesSchema], default: []},
    replycount: {type: Number, default: 0}
})
 */
const bcrypt = require('bcrypt')
module.exports = function (app,db) {
  
  app.route('/api/threads/:board')
  .post(async (req,res)=>{
    const board = req.params.board
    const text = req.body.text
    const delete_password = await bcrypt.hash(req.body.delete_password,10)
    const thread = await db.create({
      text: text,
      board: board,
      delete_password: delete_password
    })
    /*  When the header is set to 'application/json', return a JSON object. This is mandatory in order to pass the test.*/
    if (req.headers.accept.includes('application/json')) {
      return res.json(thread);
    }
    return res.redirect(`/b/${board}/`)
  
  })
  .get(async (req,res)=>{
    const board = req.params.board
    try{
      const threads = await db.find({board},'-board -delete_password -reported -__v').sort({bumped_on: 'descending'}).limit(10).lean()
      /* With mongoose when you execute a query, the return is an entire mongoose document, with all the methods like save() find() ecc..
      With lean you can strip all that and returns just a plain js obj*/
      const result = threads.map((thread) => {
        const sortedReplies = thread.replies.sort((a,b) => new Date(b.created_on) - new Date(a.created_on)).slice(0,3)
        return {
          _id: thread._id,
          text: thread.text,
          created_on: thread.created_on,
          bumped_on: thread.bumped_on,
          replies: sortedReplies
        }
      })
      return res.json(result)
      
    }catch(error){
      return res.status(404).send('Board not found')
    }

  })
  .delete(async (req,res) => {
    const thread_id = req.body.thread_id
    const delete_password = req.body.delete_password
    try{
      const threadPasswordHash = (await db.findById(thread_id).lean()).delete_password
      const match = await bcrypt.compare(delete_password, threadPasswordHash)
      if(match){
        await db.findByIdAndDelete(thread_id)
        return res.send('success')
      }
      return res.send('incorrect password')
    }catch(error){
      return res.send('thread not found')
    }

  })
  .put(async (req,res)=>{
    const thread_id = req.body.thread_id
    try{
      await db.findByIdAndUpdate(thread_id,{reported: true})
      return res.send('reported')
    }catch(error){
      return res.send('thread not found')
    }
    
    
  })
    
  app.route('/api/replies/:board');

};
