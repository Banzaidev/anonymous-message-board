const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
    const testText = 'test thread text'
    const testBoard = 'test'
    const testPassw = 'test-passw'
    const testDate = new Date()
    let testThreadID = ''
    test('Creating a new thread: POST request to /api/threads/{board}',(done) =>{
        chai.request(server)
        .post(`/api/threads/${testBoard}`)
        .set('Accept', 'application/json')
        .send({
            'text':testText,
            'delete_password':testPassw
        })
        .end((err,res) => {
            if(err){
                return done(err)
            }
            assert.equal(res.body.text, testText)
            assert.approximately(new Date(res.body.created_on).getTime(), testDate.getTime(),1000)
            assert.approximately(new Date(res.body.bumped_on).getTime(), testDate.getTime(),1000)
            //assert.equal(res.body.replies,[]) this compare two memory address, which can't be the same
            assert.deepEqual(res.body.replies,[])
            testThreadID = res.body['_id']
            return done()
        })
    })
    test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}',(done) =>{
        chai.request(server)
        .get(`/api/threads/${testBoard}`)
        .end((err,res) => {
            if(err){
                return done(err)
            }
            assert.typeOf(res.body,'array')
            assert.isAtMost(res.body.length, 10)
            res.body.forEach((thread) => {
                assert.notProperty(thread,'reported')
                assert.notProperty(thread,'delete_password')

                assert.isArray(thread.replies)
                assert.isAtMost(thread.replies.length,3)

                thread.replies.forEach((reply) => {
                    assert.notProperty(reply, 'reported')
                    assert.notProperty(reply, 'delete_password')
                })
            }) 
            return done()
        })
    }) 
    test('Reporting a thread: PUT request to /api/threads/{board}',(done) =>{
        chai.request(server)
        .put(`/api/threads/${testBoard}`)
        .send({
            'thread_id': testThreadID,
        })
        .end((err,res) => {
            if(err){
                return done(err)
            }
            assert.equal(res.text, 'reported')
            return done()
        })
    })
    const testReplyText = 'test reply'
    const testReplyDeletePassw = 'test-del-rep'
    const testBumpedDate = new Date()
    let testReplyID = ''
    test('Creating a new reply: POST request to /api/replies/{board}',(done) =>{
        chai.request(server)
        .post(`/api/replies/${testBoard}`)
        .set('Accept', 'application/json')
        .send({
            'text': testReplyText,
            'thread_id':testThreadID,
            'delete_password':testReplyDeletePassw
            
        })
        .end((err,res) => {
            if(err){
                return done(err)
            }
            assert.equal(res.body.replies[0].text, testReplyText)
            assert.approximately(new Date(res.body.created_on).getTime(), testDate.getTime(),1000)
            assert.approximately(new Date(res.body.bumped_on).getTime(), testBumpedDate.getTime(),1000)
            testReplyID = res.body.replies[0]['_id']
            return done()
        })
    })
    test('Viewing a single thread with all replies: GET request to /api/replies/{board}',(done) =>{
        chai.request(server)
        .get(`/api/replies/${testBoard}?thread_id=${testThreadID}`)
        .end((err,res) => {
            if(err){
                return done(err)
            }
            assert.equal(res.body.text, testText)
            assert.equal(res.body.replies[0].text, testReplyText)
            assert.approximately(new Date(res.body.created_on).getTime(), testDate.getTime(),1000)
            assert.approximately(new Date(res.body.bumped_on).getTime(), testBumpedDate.getTime(),1000)
            assert.isAtLeast(res.body.replies.length,1)
            return done()
        })
    })
        test('Reporting a reply: PUT request to /api/replies/{board}',(done) =>{
        chai.request(server)
        .put(`/api/replies/${testBoard}`)
        .send({
            'thread_id':testThreadID,
            'reply_id':testReplyID,

        })
        .end((err,res) => {
            if(err){
                return done(err)
            }
            assert.equal(res.text, 'reported')
            return done()
        })
    })
    test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board}',(done) =>{
        chai.request(server)
        .delete(`/api/replies/${testBoard}`)
        .send({
            'thread_id':testThreadID,
            'reply_id':testReplyID,
            'delete_password':'invalid-passw'

        })
        .end((err,res) => {
            if(err){
                return done(err)
            }
            assert.equal(res.text, 'incorrect password')
            return done()
        })
    })
    test('Deleting a reply with the correct password: DELETE request to /api/replies/{board}',(done) =>{
        chai.request(server)
        .delete(`/api/replies/${testBoard}`)
        .send({
            'thread_id':testThreadID,
            'reply_id':testReplyID,
            'delete_password': testReplyDeletePassw

        })
        .end((err,res) => {
            if(err){
                return done(err)
            }
            assert.equal(res.text, 'success')
            return done()
        })
    })
    test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} ',(done) =>{
        chai.request(server)
        .delete(`/api/threads/${testBoard}`)
        .send({
            'thread_id': testThreadID,
            'delete_password':'incorrect'
        })
        
        .end((err,res) => {
            if(err){
                return done(err)
            }
            assert.equal(res.text, 'incorrect password')
            return done()
        })
    })
    test('Deleting a thread with the correct password: DELETE request to /api/threads/{board}',(done) =>{
        chai.request(server)
        .delete(`/api/threads/${testBoard}`)
        .send({
            'thread_id': testThreadID,
            'delete_password': testPassw
        })
        .end((err,res) => {
            if(err){
                return done(err)
            }
            assert.equal(res.text, 'success')
            return done()
        })
    })
});
