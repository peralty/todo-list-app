//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose")
const _ = require("lodash")

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// setup database connection
mongoose.connect("mongodb+srv://admin-josiah:cuBzxcuk@cluster0.0w8pg5q.mongodb.net/?retryWrites=true&w=majority", {useNewUrlParser: true})

// setup db schemas for mongodb
const itemsSchema = {
  name : String
};
const listSchema = {
  name: String,
  items: [itemsSchema]
};

// setup models for mongodb
const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

// setup default value list
const item1 = new Item({
  name: "Welcome to your todolist!"
});
const item2 = new Item({
  name: "Hit the + button to add new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});
const defaultItems = [item1, item2, item3];

app.get("/", function(req, res) {
  const day = date.getDate();

  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      dbInsertDefaultValues();
      res.redirect("/");
    } else {
      // console.log(foundItems);
      res.render("list", {listTitle: day, newListItems: foundItems});
    }
  });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, function (err, foundList) {
    if (!foundList) {
      // console.log("List does not exist yet.");
      const list = new List ({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect(`/${customListName}`);
    } else {
      // console.log("List already exists in database.");
      res.render("list", {listTitle: customListName, newListItems: foundList.items});
    }
  });
});

app.post("/", function(req, res){
  const listName = req.body.list;
  const item = new Item({
    name: req.body.newItem
});

  if (listName === date.getDate().toString()) {
    dbInsertNewItem(item);
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect(`/${listName}`)
    });
  }
});

app.post("/delete", function (req, res){
  const itemId = req.body.checkBoxItem;
  const listName = req.body.listName;

  if (listName === date.getDate().toString()) {
    dbDeleteItemById(itemId);
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
        {name: listName},
        {$pull: {items: {_id: itemId}}},
        function (err, foundList) {
          if (!err) {
            res.redirect(`/${listName}`);
          }
        });
  }


});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

// helper methods
function dbInsertDefaultValues(defaultItemsList) {
  Item.insertMany(defaultItems, function(err){
    if (err) {
      console.log(err);
    } else {
      console.log("Successfully saved default items to database");
    }
  });
}

function dbInsertNewItem(item) {
  item.save(function (err, item){
    if (err) {
      console.log(err);
    } else {
      console.log(`Successfully saved item with id ${item.id} to database.`);
    }
  });
}

function dbDeleteItemById(itemId) {
  Item.findByIdAndDelete(itemId, function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log(`Successfully deleted item with id ${itemId} from database.`);
    }
  });
}