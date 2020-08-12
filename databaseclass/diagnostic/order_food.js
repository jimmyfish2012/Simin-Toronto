module.exports = function(){
    var express = require('express');
    var router = express.Router();

    /* get people to populate in dropdown */
    function getOrder(res, mysql, context, complete){
        mysql.pool.query("SELECT orders.OrderID AS oid FROM orders", function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
            context.order = results;
            complete();
        });
    }

    /* get certificates to populate in dropdown */
    function getDishes(res, mysql, context, complete){
        sql = "SELECT FoodID AS fid, FoodName, FoodPrice AS price FROM food";
        mysql.pool.query(sql, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end()
            }
            context.food = results
            complete();
        });
    }

    /* get people with their certificates */
    /* TODO: get multiple certificates in a single column and group on
     * fname+lname or id column
     */
    function getOrderwithFood(res, mysql, context, complete){
        sql = "SELECT orders.OrderID AS oid, orders.OrderDate AS date, FoodName, food.FoodID AS fid FROM orders Inner JOIN order_lines on orders.OrderID = order_lines.OrderID Inner JOIN food on order_lines.FoodID = food.FoodID ORDER BY orders.OrderDate"
         mysql.pool.query(sql, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end()
            }
            context.order_with_food = results
            complete();
        });
    }
  

    /* List people with certificates along with 
     * displaying a form to associate a person with multiple certificates
     */
    router.get('/', function(req, res){
        var callbackCount = 0;
        var context = {};
        context.jsscripts = ["deleteperson.js"];
        var mysql = req.app.get('mysql');
        var handlebars_file = 'order_food'

        getOrder(res, mysql, context, complete);
        getDishes(res, mysql, context, complete);
        getOrderwithFood(res, mysql, context, complete);
        function complete(){
            callbackCount++;
            if(callbackCount >= 3){
                res.render(handlebars_file, context);
            }
        }
    });

    /* Associate certificate or certificates with a person and 
     * then redirect to the people_with_certs page after adding 
     */
    router.post('/', function(req, res){
        console.log("We get the multi-select Food dropdown as ", req.body.food)
        var mysql = req.app.get('mysql');
        // let's get out the certificates from the array that was submitted by the form 
        var lines = req.body.food
        var order = req.body.oid
        for (let line of lines) {
          console.log("Processing food id " + line)
          var sql = "INSERT INTO order_lines (OrderID, FoodID) VALUES (?,?)";
          var inserts = [order, line];
          sql = mysql.pool.query(sql, inserts, function(error, results, fields){
            if(error){
                //TODO: send error messages to frontend as the following doesn't work
                /* 
                res.write(JSON.stringify(error));
                res.end();
                */
                console.log(error)
            }
          });
        } //for loop ends here 
        res.redirect('/order_food');
    });

    /* Delete a person's certification record */
    /* This route will accept a HTTP DELETE request in the form
     * /pid/{{pid}}/cert/{{cid}} -- which is sent by the AJAX form 
     */
    router.delete('/oid/:oid/food/:fid', function(req, res){
        //console.log(req) //I used this to figure out where did pid and cid go in the request
        console.log(req.params.oid)
        console.log(req.params.fid)
        var mysql = req.app.get('mysql');
        var sql = "DELETE FROM order_lines WHERE OrderID = ? AND FoodID = ?";
        var inserts = [req.params.oid, req.params.fid];
        sql = mysql.pool.query(sql, inserts, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.status(400); 
                res.end(); 
            }else{
                res.status(202).end();
            }
        })
    })

    return router;
}();
