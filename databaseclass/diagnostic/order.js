module.exports = function(){
    var express = require('express');
    var router = express.Router();


        /* get people to populate in dropdown */
        function getPeople(res, mysql, context, complete){
            mysql.pool.query("SELECT customers.CusID as pid, customers.CusLname as lname, customers.CusFname as fname, OrderID AS oid, OrderDate AS date FROM orders Left Join customers ON customers.CusID = orders.CusID", function(error, results, fields){
                if(error){
                    res.write(JSON.stringify(error));
                    res.end();
                }
                context.people = results;
                complete();
            });
        }

        function getOrder(res, mysql, context, complete){
            mysql.pool.query("Select OrderID AS oid, OrderDate AS date from orders", function(error, results, fields){
                if(error){
                    res.write(JSON.stringify(error));
                    res.end();
                }
                context.order = results;
                complete();
            });
        }
      

        router.get('/', function(req, res){
            var callbackCount = 0;
            var context = {};
            context.jsscripts = ["deleteperson.js"];
            var mysql = req.app.get('mysql');
            getOrder(res, mysql, context,complete);
            getPeople(res, mysql, context, complete);
            function complete(){
                callbackCount++;
                if(callbackCount >= 2){
                    res.render('order', context);
                }
            }
        });


        /* Create an order */
        router.post('/', function(req, res){
            console.log(req.body)
            var mysql = req.app.get('mysql');
            var sql = "INSERT INTO orders (CusID) VALUES (?)";
            var inserts = [req.body.pid];
            sql = mysql.pool.query(sql,inserts,function(error, results, fields){
                if(error){
                    console.log(JSON.stringify(error))
                    res.write(JSON.stringify(error));
                    res.end();
                }else{
                    res.redirect('/order');
                }
            });
        });


        return router;
}();