var express = require('express');
var router = express.Router();

var loki = require('lokijs');

//创建数据库
var db = new loki('data.json', {
    autoload: true,
    autoloadCallback: databaseInitialize,
    autosave: true,
    autosaveInterval: 4000
});

// implement the autoloadback referenced in loki constructor
//创建数据表
function databaseInitialize() {
    var bookings = db.getCollection("bookings");
    if (bookings === null) {
        bookings = db.addCollection("bookings");
    }
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* Handle the Form */
//获得客户端发到form的post报文后，返回header和body
//Echoing the From Inputs
router.post('/form', function (req, res) {

  //解析数字，将数据存到指定数据库文件内
  db.getCollection("bookings").insert(req.body);

  var response = {
      header: req.headers,
      body: req.body
  };

  res.json(response);    
});

/* Display all Bookings */
//访问/bookings时展示数据
router.get('/bookings', function (req, res) {
  //导出数据表数据
  var result = db.getCollection("bookings").find();
  //使用模板bookings.ejs进行渲染
  res.render('bookings', { bookings: result });
});

/* Display a single Booking */
//:id 可以使该部分地址可变，通过读取id属性获取实际值
router.get('/bookings/read/:id', function (req, res) {

  console.log(req.params.id)
//从数据库bookings中找一条$loki值为id的记录，$loki为记录的识别编号，存在该对象返回对象，不存在返回false
//parseInt方法将其他类型转为int
  let result = db.getCollection("bookings").findOne({ $loki: parseInt(req.params.id) });

  if (result)
  //找到叫booking的页面视图，在客户端显示；数据库记录传给{}中变量booking,无法直接将result传到前端
    res.render('booking', { booking: result });
  else
    res.status(404).send('Unable to find the requested resource!');

});

// Delete a single Booking 
router.post('/bookings/delete/:id', function (req, res) {

  // db.getCollection("bookings").findAndRemove({ $loki: parseInt(req.params.id) });
  //获取数据表中对应数据项
  let result = db.getCollection("bookings").findOne({ $loki: parseInt(req.params.id) });
  
  if (!result) return res.status(404).send('Unable to find the requested resource!');
 //删掉该数据
  db.getCollection("bookings").remove(result);
  
  res.send("Booking deleted.");
   
});

// Form for updating a single Booking 
//get方法获取通过网址过来的访问
router.get('/bookings/update/:id', function (req, res) {

  let result = db.getCollection("bookings").findOne({ $loki: parseInt(req.params.id) });

  if (!result) return res.status(404).send('Unable to find the requested resource!');

  res.render("update", { booking: result })

});

// Updating a single Booking 
//post 方法获取通过post报文过来的访问
router.post('/bookings/update/:id', function (req, res) {

  let result = db.getCollection("bookings").findOne({ $loki: parseInt(req.params.id) });

  if (!result) return res.status(404).send('Unable to find the requested resource!');

  db.getCollection("bookings").findAndUpdate({ $loki: parseInt(req.params.id) },
    function (item) {
      //用body所有参数覆盖item的参数
      Object.assign(item, req.body)
    });

  res.send("Booking updated.");

});

/* Searching */
router.get('/bookings/search', function (req, res) {

  var whereClause = {};

  //{$regex:   } 可以使字段部分匹配而非精确匹配
  // https://rexrainbow.github.io/phaser3-rex-notes/docs/site/lokijs/
  if (req.query.name) whereClause.name = { $regex: req.query.name };

  //如果数字为空，则返回NaN，这是整数中的空值，无法通过==来判断，只能通过isNaN方法
  var parsedNumTickets = parseInt(req.query.numTickets);
  if (!isNaN(parsedNumTickets)) whereClause.number_of_tickets = parsedNumTickets;

  //find方法查找所有符合条件的数据集并全部返回
  let results = db.getCollection("bookings").find(whereClause);

  return res.render('bookings', { bookings: results });

});

/* Pagination */
router.get('/bookings/paginate', function (req, res) {

  var count = Math.max(req.query.limit, 2) || 2;
  var start = Math.max(req.query.offset, 0) || 0;

  var results = db.getCollection("bookings").chain().find({}).offset(start).limit(count).data();

  var totalNumRecords = db.getCollection("bookings").count();

  return res.render('paginate', { bookings: results, numOfRecords: totalNumRecords });

});

//通过路由器导出模块
module.exports = router;
