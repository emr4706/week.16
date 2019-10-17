const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const request = require("request");

const app = express();
const port = 3000;

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// connect to mongodb atlas
mongoose.connect(
  "mongodb+srv://emr47ny:test123@cluster0-5ljcd.mongodb.net/todolistDB",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
);

//creat item schema
const itemSchema = {
  name: String
};

//creat item model
const Item = mongoose.model("Item", itemSchema);
const item1 = new Item({
  name: "Doe de boodschappen."
});
const item2 = new Item({
  name: "Haal de kinderen op school."
});
const item3 = new Item({
  name: "Doe opdracht van IT."
});
const defaultItems = [item1, item2, item3];

//creat list schema
const listSchema = {
  name: String,
  items: [itemSchema]
};

//creat list model
const List = mongoose.model("List", listSchema);

app.get("/", (req, res) => {
  // find items
  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("successfully saved default items to DB");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", todos: foundItems });
    }
  });
});

//creat dynamic custom list rout
app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        // creat a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        // show an existing list
        res.render("list", {
          listTitle: foundList.name,
          todos: foundList.items
        });
      }
    }
  });
});

// add new item
app.post("/add-todo", (req, res) => {
  const newTodo = req.body.newTodo;
  const listName = req.body.list;

  const item = new Item({
    name: newTodo
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

// delete item
app.post("/delete", (req, res) => {
  const checkboxId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkboxId, err => {
      if (!err) {
        console.log("successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkboxId } } },
      function(err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.listen(port, () => console.log(`Server running on port ${port}!`));
