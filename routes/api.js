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
        const sortedReplies = thread.replies.sort((a,b) => new Date(b.created_on) - new Date(a.created_on)).slice(0,3).map((reply) => {
          return {
            _id: reply._id,
            text: reply.text,
            created_on: reply.created_on
          }
        })
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
    
  /* 
    text: {type: String, required: true},
    created_on: {type: Date, default: () =>  new Date(Date.now()).toUTCString()},
    reported: {type:Boolean, default: false},
    delete_password: {type:String, required: true},
   */
  app.route('/api/replies/:board')
  .post(async (req,res) => {
    const board = req.params.board
    const thread_id = req.body.thread_id
    const text = req.body.text
    const delete_password = await bcrypt.hash(req.body.delete_password,10)
    try{
      const thread = await db.findById(thread_id)
      thread.replies.push({
        text,
        delete_password
      })
      thread.bumped_on = new Date()
      thread.replycount += 1
      await thread.save() 
      /*    
        const thread = await db.findByIdAndUpdate(thread_id, {
        $push: {replies: {
          text,
          delete_password
        }}, 
        $set: {bumped_on: new Date()}, 
        $inc: {replycount:1}
      },{new: true}) 
      
      When using findByIdAndUpdate(), you can update top-level fields,but not subdocuments properly. This is because Mongoose does not
      run schema validation middleware or apply default values during this operation, as it doesn't fully load the schema.
      The 'replies' field is a subdocument with its own schema. In MongoDB Compass, documents may appear "rehydrated", meaning that
      default values, methods, and other schema features are applied to plain JavaScript objects — so the data looks correct.
      However, when using findById(), pushing to the 'replies' array,and then calling save(), Mongoose loads the full document with all
      default values and methods. When you push new data to 'replies',Mongoose runs schema validation and applies defaults accordingly.
      Calling save() then persists the fully hydrated and validated document.
      */

      if (req.headers.accept.includes('application/json')) {
        return res.json(thread);
      }
      return res.redirect(`/b/${board}/`)

    }catch(error){
      return res.send('thread not found')
    }
  })
  .get(async (req,res) => {
    const thread_id = req.query.thread_id
    //const board = req.params.body
    const thread = await db.findById(thread_id,'-board -delete_password -replycount -reported -__v').sort({bumped_on: 'descending'}).lean()
    try{
      const replies = thread.replies.map((reply) => {
        return {
          _id: reply._id,
          text: reply.text,
          created_on: reply.created_on
        }
      })
      const result = {
        _id: thread._id,
        text: thread.text,
        created_on: thread.created_on,
        bumped_on: thread.bumped_on,
        replies: replies
      }
      return res.json(result)

    }catch(error){
      return res.send('thread or reply not found')
    }


    
  })
  .put(async (req,res) => {
    const reply_id = req.body.reply_id
    const thread_id = req.body.thread_id
    try{
      const thread = await db.findById(thread_id)
      thread.replies.forEach(reply => {
        if (reply['_id'] == reply_id){
          reply.reported = true
        }
      })
      thread.save()
      return res.send('reported')
    }
    catch(error){
      return res.send('thread or reply not found')
    }

  })
  .delete(async (req,res) => {
    const thread_id = req.body.thread_id
    const reply_id = req.body.reply_id
    const delete_password = req.body.delete_password
    let result = 'thread or reply not found'
    try{
      const thread = await db.findById(thread_id)
      for(let reply of thread.replies){
        if(reply['_id'] == reply_id){
          const match = await bcrypt.compare(delete_password, reply.delete_password)
          if(match){
            reply.text = '[deleted]'
            result = 'success'
          }else{
            result = 'incorrect password'
          }
          break
        }
      }
      thread.save()
      return res.send(result)
  
    }catch(error){
      return res.send(result)
    }

  })

};
