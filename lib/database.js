const mysql=require("mysql");
const config=require("../config/config");
let pool=mysql.createPool(config.database);
let connection=function(sql,callback){
    pool.getConnection(function (err,connection) {
        if(err)
            callback(err,null);
        else{
            connection.query(sql,function (err,rows) {
                connection.release();
                callback(err,rows);
            })
        }
    })
}

module.exports=connection;