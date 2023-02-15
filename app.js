const express = require('express');
const mongoose = require('mongoose');
const _ = require('lodash')

const app = express();
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
mongoose.set('strictQuery', false);

mongoose.connect("mongodb+srv://admin-michael:Password123@clustertodo.jpotsaz.mongodb.net/todolistDB", {useNewUrlParser: true})

const port = process.env.PORT || 3000;

const itemsSchema = new mongoose.Schema({
  name: String
})

const Item = mongoose.model('Item', itemsSchema)

const item1 = new Item({
  name: "Welcome to you to-do list"
})

const item2 = new Item({
  name: "Add items at the bottom"
})

const item3 = new Item({
  name: "<-- click to delete items"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
})

const List = mongoose.model('List', listSchema);

app.get("/", function (req, res) {
  Item.find({}, function(err, items){
    if (err) {
      console.log(err)
    } else {
      if (items.length === 0) {
        Item.insertMany(defaultItems, function(err){
          if (err){
            console.log(err)
          } else {
            console.log("defaultItems documents succesfuly inserted into items collection")
          }
        })
        res.redirect('/');
      }
      res.render("list", { listTitle: "Today", newListItems: items });
    }
  })
});

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err,foundList){
    if (err) {
      console.log(err)
    } else {
      if (!foundList) {
        // create new list
        console.log("No list found matching that name. New List created.")
        const list = new List({
          name: customListName,
          items: defaultItems
        })
        list.save();
        res.redirect('/' + customListName);
      } else {
        // show list
        console.log("A List by that name already exists.")
        res.render('list', { listTitle: customListName, newListItems: foundList.items })
      }
    }
  })
})

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.listName;
  const newItem = new Item({
    name: itemName
  });

  if (listName === "Today"){
    newItem.save(); 
    res.redirect('/');
  } else {
    List.findOne({name: listName}, function(err, foundList){
      if (!err){
        foundList.items.push(newItem);
        foundList.save();
        res.redirect('/' + listName)
      } else {
        console.log(err)
      }
    })
  }
});

app.post("/delete", function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){
    Item.deleteOne({_id: checkedItemId}, (err) => {
      if (err) {
        console.log(err)
      } else {
        console.log("successfully deleted item with _id: " + checkedItemId);
        res.redirect('/');
      }
    });
  } else {
    List.findOneAndUpdate(
      {name:listName}, 
      {$pull: {items: {_id: checkedItemId}}}, 
      (err, result) => {if (err) {console.log(err)}});
    res.redirect('/' + listName)
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(port, function () {
  console.log(`Server listenning on port ${port}`);
});