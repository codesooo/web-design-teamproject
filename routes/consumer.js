var express = require('express');
const mysql = require("../config/database.js");
const crypto= require("crypto");
const jwt = require("jsonwebtoken");
const session = require("express-session");

var router = express.Router();

require('dotenv').config({
  path : ".env",
});

router.get('/', function(req, res, next) {
  if(!req.session.user) res.redirect('/');
  if(jwt.verify(req.session.user.token, process.env.ACCESS_TOKEN_SECRET).user.role != 'consumer') res.redirect('/');
  res.render('consumer/home', { title: 'able'});
});

// 장바구니 (상품 목록)
router.get('/mycartlist', async (req, res, next) => {
  if(!req.session.user) res.redirect('/');
  if(jwt.verify(req.session.user.token, process.env.ACCESS_TOKEN_SECRET).user.role != 'consumer') res.redirect('/');
  let consumerID = jwt.verify(req.session.user.token, process.env.ACCESS_TOKEN_SECRET).user.id;
  const result = await mysql.query("userLogin", consumerID);
  const result1 = await mysql.query("mycartList", consumerID);
  console.log("가져온 result1", result1);
  
  let prodID = [];
  for(var i=0; i < result1.length ; i++){
    let pid = result1[i].productId;
    prodID.push(pid);
  };
  console.log("prodID", prodID);
  //const result2 = await mysql.query("productlisRead", prodID);
  // 장바구니에 등록하려는 상품이 이미 같은 아이디에 있으면 막기

  res.render('consumer/mycart', { title: 'able', info: result1, consum: result});
});

// 장바구니 상품 상세 (상세페이지로 연결)
router.get('/mycartlist/:id', async (req, res, next) => {
  if(!req.session.user) res.redirect('/');
  if(jwt.verify(req.session.user.token, process.env.ACCESS_TOKEN_SECRET).user.role != 'consumer') res.redirect('/');
  let consumerID = jwt.verify(req.session.user.token, process.env.ACCESS_TOKEN_SECRET).user.id;
  const id = req.params.id; // 이건 상품 아이디!
  const result = await mysql.query("productlisRead", id);
  console.log("result", result[0]);
  res.render('index/goodsDetail', { title: 'able', info: result[0]});
});

// 장바구니에 상품 추가
router.get('/mycart/:id', async function(req,res,next) {
  if(!req.session.user) res.redirect('/');
  if(jwt.verify(req.session.user.token, process.env.ACCESS_TOKEN_SECRET).user.role != 'consumer') res.redirect('/');
  const id = req.params.id;
  console.log("상품 id", id);

  let consumerID = jwt.verify(req.session.user.token, process.env.ACCESS_TOKEN_SECRET).user.id;
  
  const resultN2 = await mysql.query("userLogin", consumerID);
  const prod = await mysql.query("productlisRead", id);
  const prodname = prod[0].name;
  console.log("prodname", prodname);
  const inputdata = [consumerID, id, prodname];
  const result = await mysql.query("intoMycart", inputdata);
  const incart = await mysql.query("mycartList", consumerID);
  console.log("장바구니 확인!!", incart);

  res.render("/index/goodsDetail");
  //res.send("<script> console.log('🎈 장바구니에 상품을 담았습니다 ✨');</script>");
});

// 검색 페이징
router.get('/search', async (req, res, next) => {
  if(!req.session.user) res.redirect('/');
  if(jwt.verify(req.session.user.token, process.env.ACCESS_TOKEN_SECRET).user.role != 'consumer') res.redirect('/');
  let consumerID = jwt.verify(req.session.user.token, process.env.ACCESS_TOKEN_SECRET).user.id;
  console.log("consumerID :", consumerID);
  res.render('consumer/search', { title: 'able'});
});

// 검색 결과 
router.post('/searchres', async (req, res, next) => {
  if(!req.session.user) res.redirect('/');
  if(jwt.verify(req.session.user.token, process.env.ACCESS_TOKEN_SECRET).user.role != 'consumer') res.redirect('/');
  let consumerID = jwt.verify(req.session.user.token, process.env.ACCESS_TOKEN_SECRET).user.id;
  console.log("consumerID :", consumerID);
  let keyword = req.body.keyword;
  console.log("검색 단어", keyword);
  const result = await mysql.query("search", "%"+keyword+"%");
  console.log("result : ", result);
  res.render('consumer/searchresult', { title: 'able'});
});

// 마이페이지 중 내 정보
router.get('/mypage', async (req, res, next) => {
  if(!req.session.user) res.redirect('/');
  if(jwt.verify(req.session.user.token, process.env.ACCESS_TOKEN_SECRET).user.role != 'consumer') res.redirect('/');
  let consumerID = jwt.verify(req.session.user.token, process.env.ACCESS_TOKEN_SECRET).user.id;
  console.log("consumerID :", consumerID);
  const result = await mysql.query("userLogin", consumerID);
  console.log("result : ", result);
  res.render('consumer/pagemyinfo', { title: 'able', info: result});
});

// 내 정보 수정
router.get('/mypage/editinfo', async (req, res, next) => {
  if(!req.session.user) res.redirect('/');
  if(jwt.verify(req.session.user.token, process.env.ACCESS_TOKEN_SECRET).user.role != 'consumer') res.redirect('/');
  let consumerID = jwt.verify(req.session.user.token, process.env.ACCESS_TOKEN_SECRET).user.id;
  const result = await mysql.query("userLogin", consumerID);
  res.render('consumer/pageEditMyinfo', { title: 'able', info: result});
});


router.post('/mypage/editinfo/done', async (req, res, next) => {

  let consumerID = jwt.verify(req.session.user.token, process.env.ACCESS_TOKEN_SECRET).user.id;
  console.log("consumerID :", consumerID);
  console.log(req.params);
  var data = [req.body.newname, req.body.newemail, req.body.newphonenum, consumerID];
  console.log("새로 업데이트 되는 : ", data);

  const result = await mysql.query("userUpdate", data);
  const result2 = await mysql.query("userLogin", consumerID);
  console.log("result2 : ", result2);
  res.redirect("/consumer/mypage");
});

// 구매내역
router.get('/myorder', async (req, res, next) => {
  if(!req.session.user) res.redirect('/');
  if(jwt.verify(req.session.user.token, process.env.ACCESS_TOKEN_SECRET).user.role != 'consumer') res.redirect('/');

  let consumerID = jwt.verify(req.session.user.token, process.env.ACCESS_TOKEN_SECRET).user.id;
  const result = await mysql.query("purchaseRead",  consumerID);

  res.render('consumer/pagemyorder', { title: 'able' , row:result});
});

router.get('/mypurchase/:id', async (req, res, next) => {
  const id = req.params.id;
  const result = await mysql.query("purchaseIdRead", id);
  res.render('consumer/purchaseRead', {row:result[0]});  
});

router.get('/myqna', async (req, res, next) => {
  if(!req.session.user) res.redirect('/pagemyqna');
  if(jwt.verify(req.session.user.token, process.env.ACCESS_TOKEN_SECRET).user.role != 'consumer') res.redirect('/');
  res.render('consumer/pagemyqna', { title: 'able' });
});

router.get('/addPoint', async (req, res, next) => {
  if(!req.session.user) res.redirect('/');
  if(jwt.verify(req.session.user.token, process.env.ACCESS_TOKEN_SECRET).user.role != 'consumer') res.redirect('/');
  let consumerID = jwt.verify(req.session.user.token, process.env.ACCESS_TOKEN_SECRET).user.id;
  const result = await mysql.query("readPoint", consumerID);
  res.render("consumer/pagemypoint", { title: "able", row: result});
});

router.post('/addPoint', async (req, res, next) => {
  if(!req.session.user) res.redirect('/pagemyinfo');
  if(jwt.verify(req.session.user.token, process.env.ACCESS_TOKEN_SECRET).user.role != 'consumer') res.redirect('/');
  let consumerID = jwt.verify(req.session.user.token, process.env.ACCESS_TOKEN_SECRET).user.id;
  const result = await mysql.query("addPoint", [req.body.addpoint, consumerID]);
  res.redirect("/consumer/addpoint");
});

// 카테고리 연결 router를 하나로 할 수 있다면..
/*
router.get('category/:category'), async (req, res, next) => {
  const result = await mysql.query("cateProduct", )
}
*/

// 다이어리 상품
router.get('/diary', async (req, res, next) => {
  const result = await mysql.query("diaryProduct");
  res.render("category/diary", { title: "다이어리 상품", row: result});


});

// 필기노트 상품
router.get('/note', async (req, res, next) => {
  const result = await mysql.query("noteProduct");
  res.render("category/note", { title: "필기노트 상품", row: result});
});

// 스티커 상품
router.get('/sticker', async (req, res, next) => {
  const result = await mysql.query("stickerProduct");
  res.render("category/sticker", { title: "스티커 상품", row: result});
});

 //배경화면 상품
router.get('/wallpaper', async (req, res, next) => {
  const result = await mysql.query("wpaperProduct");
  res.render("category/wallpaper", { title: "배경화면 상품", row: result});
});

// 상품 상세 페이지
router.get('/details/:id', async function(req, res, next) {
  const id = req.params.id;
  console.log(id);
  const result = await mysql.query("productlisRead", id);
  console.log(result[0]);
  res.render("index/goodsDetail", { title: "able "+result[0].name+ " 's Detail", row : result[0]});
});



router.get('/buy/:id', async function(req,res,next) {
  const id = req.params.id;
  // console.log(id);

  let consumerID = jwt.verify(req.session.user.token, process.env.ACCESS_TOKEN_SECRET).user.id;


  const resultN1 = await mysql.query("productlisRead", id);
  const resultN2 = await mysql.query("userLogin", consumerID);
  const resultN3 = await mysql.query("readPoint", consumerID);

  console.log("확인!!", resultN1[0]);
  resultN1[0].price = Number( resultN1[0].price.replace(",","")); //price를 varchar -> int 변환

  console.log('흠',resultN1[0]);

  res.render("index/purchase", { title: "상품 구매" ,row : resultN1[0], consum : resultN2[0], point:resultN3[0]});

});

router.get('/buycomplete', async function(req,res,next){
  res.render('index/completePurchase', { title: "구매 완료"});
});

router.post('/buy/bycom/:id', async function(req,res,next) {
  let consumerID = jwt.verify(req.session.user.token, process.env.ACCESS_TOKEN_SECRET).user.id;
  console.log(consumerID);
  
  const id = req.params.id;
  console.log("아이딩",id);

  const resultN1 = await mysql.query("productlisRead", id);
  resultN1[0].price = Number( resultN1[0].price.replace(",",""));
  console.log(resultN1[0].price);

  console.log(resultN1[0].price, consumerID);
  const resultN2 = await mysql.query("minusPoint", [resultN1[0].price, consumerID]);

  var data = [id,consumerID, resultN1[0].name];
  console.log('구매 데이터',data);
  // // res.render("index/purchage", { title: "상품 구매" ,row : resultN1[0], consum : resultN2[0], point:resultN3[0]});
  const resultN3 = await mysql.query("newPurchase", data);
  res.send("<script>alert('상품 구매 완료.');location.href='/consumer/buycomplete';</script>"); 
})


module.exports = router;