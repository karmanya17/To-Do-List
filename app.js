//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose=require("mongoose");
const date = require(__dirname + "/date.js");
const _=require("lodash");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB",{useNewUrlParser:true},{ useUnifiedTopology: true });

let day=date.getDate();
const itemSchema={
  name:{type:String,required:true}
};
const Item=mongoose.model("Item",itemSchema);


const item1=new Item({
  name:"Check the box to delete a Task"
});

const defaultItems=[item1];

const listSchema={
  name:String,
  items:[itemSchema]
}
const List=mongoose.model("List",listSchema);

app.get("/", function(req, res) {
Item.find({},function(err,foundItems){
  if(foundItems.length==0)
  {
    Item.insertMany(defaultItems,function(err){
      if(err){
        console.log(err);
      }
      else{
        console.log("Successfully saved default items to DB");
      }
    });
    res.redirect("/");
  }
  else{
    res.render("list", {listTitle:`Today ${day}`, newListItems: foundItems});
  }
});
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName=req.body.list;
  const item=new Item({
    name:itemName
  });

  if(listName===`Today ${day}`){
  item.save();
  res.redirect("/");
  }
  else{
    List.findOne({name:listName},function(err,foundList){
    foundList.items.push(item);
    foundList.save();
    res.redirect("/"+listName);
  })
}
});
app.post("/list",function(req,res){
  const listName=_.capitalize(req.body.listName);
  if(listName===`Today ${day}`)
  {
    res.redirect("/");
  }
  else{
    List.findOne({name:listName},function(err,foundlist){
      if(!foundlist)
      {
        res.redirect("/");
      }
      else
      {
        res.redirect("/"+listName);
      }
    })
  }
});

app.post("/customlist",function(req,res){
  const customListName=req.body.customListName;
  console.log(customListName);
  res.redirect("/"+customListName);
});
app.get("/:customList", function(req,res){
  const customListName=_.capitalize(req.params.customList);
  List.findOne({name:customListName},function(err,foundList){
    if(!err){
      if(!foundList){
        const list=new List({
          name:customListName,
          items:defaultItems
        });

        list.save();
        res.redirect("/"+customListName);
      }
      else
      {
        res.render("list",{listTitle:foundList.name,newListItems:foundList.items});
      }
    }
  })

});

app.get("/about", function(req, res){
  res.render("about");
});
app.post("/delete",function(req,res){
  const checkedItemId=req.body.checkbox;
  const listName=req.body.listName;

  if(listName==="Today")
  {
    Item.findByIdAndRemove(checkedItemId,function(err){
      if(err)
      {
        console.log(err);
      }
      else
      {
        console.log("Successfully deleted");
      }
      res.redirect("/");
    })
  }
  else
  {
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}},function(err,foundList){
      if(!err)
      {
        res.redirect("/"+listName);
      }
    })
  }
})

let port=process.env.PORT;
if(port==null||port=="")
{
  port=3000;
}
app.listen(port, function() {
  console.log("Server started Succesfully");
});
