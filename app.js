const express = require("express");
const path = require("path");
const fs = require('fs');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const session = require('express-session');
var busboy = require('connect-busboy');
const fileUpload = require('express-fileupload');
const multer = require('multer');
const mkdirp = require('mkdirp');
const port = 3000;


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));


app.use(express.static(path.join(__dirname, '/public')));
app.use(fileUpload());

const uri = `mongodb+srv://jivesh_2003:JiveshGupta@20@cluster0.7wh6p.mongodb.net/hack36?retryWrites=true&w=majority`

var count = 0;
var connected = 0;
mongoose
    .connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true
    }, { autoReconnect: true })
    .then(() => { console.log('Connected With Database'); connected = 1; })
    .catch((err) => {
        console.log('Not Connected With Database');
        count++;
        console.log('trying to connect' + count + 'times');

        console.log(err);
    });

const users = require('./models/users');
const complaints = require('./models/complaints');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());


app.use(cookieParser());


app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
}));


app.get('/', async (req,res) => {
    res.render('root.ejs');
});


app.post('/signUp', async(req, res) => {
    
    res.cookie('isLogined',false);
    // req.session.isLogined=false;
    var userBody = req.body;
    if (userBody.password) {
        var newUser = new users(
            { name: userBody.name, email: userBody.email, password: userBody.password, phone: userBody.phone }
        );
        await newUser.save()
            .then(newUser => {
                console.log(`${newUser} added`);
            })
            .catch(err => {
                console.log(err);
            });
        res.redirect('/');
    }
    else {
        document.alert(`passwords do not match`);
    }
});


app.get('/allComplaints', async (req, res) => {
    try {
        var allComplaints = await complaints.find({}).exec();
        // console.log(allComplaints[0]);
        // res.send(allComplaints);
        res.render('allComplaints.ejs', { allComplaints });

    }
    catch (error) {
        console.log('error', error);
    }
});

app.get('/login', async (req, res) => {
    
    var userQuery = req.query;
    try {
        var user = await users.findOne({ email: userQuery.email, password: userQuery.password }).exec();
        // console.log(`details ${userQuery.email} ${userQuery.password} hello `);
        if (user) {
            console.log('user is', user);
            
            res.cookie('isLogined',true);
            res.cookie('userId',user._id);
            console.log(req.cookies);
            
            // res.redirect('/allComplaints');
            res.redirect('/home');
        }
        else {
            // alert(`incorrect login datails`);
            res.send('login failed');
        }
    }
    catch (error) {
        return console.log('error', error);

    };
    console.log('after');
    // res.send('success');

});



app.get('/home', async (req, res) => {

    var { isLogined = false } = req.cookies;
    if( isLogined !== 'true'){
        res.redirect('/');
    }
    else{
        var userId=req.cookies.userId;
        try{
            var user= await users.findById(userId).exec();
        
        var cssFiles = ['style.css.css', 'leftStage.css', 'centerStage.css', 'rightStage.css', 'home.css'];
    // try {
        var complaintsList = await complaints.find({ authorEmail: user.email });
        // let keys = [];
        // let lPrice = "";
        // let hPrice = "";
        // console.log(user, typeof (complaintsList), complaintsList.length);
        res.render('home.ejs', { user, complaintsList, cssFiles });

    } catch (error) {
        console.log('error', error);
    }
}
});

app.get('/profile', async (req, res) => {
    var { isLogined = false } = req.cookies;
    // req.session.isLogined=false;
    // console.log(req.session.isLogined);
    if( isLogined !== 'true'){
        res.redirect('/');
        
    }
    else{
        var userId=req.cookies.userId;
        try{
            var user= await users.findById(userId).exec();
        
    var cssFiles = ['style.css.css', 'leftStage.css', 'centerStage.css', 'rightStage.css', 'profile.css'];
    try {
        var complaintsList = await complaints.find({ authorEmail: user.email });
        // let keys = [];
        // let lPrice = "";
        // let hPrice = "";
        res.render('profile.ejs', { user, complaintsList,cssFiles  });

    }
    catch (error) {
        console.log('error', error);
    }
}
catch(error){console.log(error);}}
});


app.post('/updateUserProfile', async (req, res) => {
    var { isLogined = false } = req.cookies;
    
    if( isLogined !== 'true'){
        res.redirect('/');
    }
    else{
        var userId=req.cookies.userId;
        try{
            var user= await users.findById(userId).exec();
        
    // console.log('after getting user', typeof (req.file), typeof(req.files), req.files);
    if(req.files == null){
        
    var cpname = "";
    var dpname = "";
    }else {
    var dp = req.files.displayPic;
    var cp = req.files.coverPic;
    var cpname = typeof(cp) !== 'undefined' ? cp.name : "";
    var dpname = typeof(dp) !== 'undefined' ? dp.name : "";
    
}


    try {
        
        var oldcp=user.coverPic;
        var olddp=user.displayPic;
        user.name = req.body.name;
        user.email = req.body.email,
        user.phone = req.body.phone;
        user.college = req.body.college;
        user.branch = req.body.branch;
        user.bio = req.body.bio;
        if (dpname != "") {
            user.displayPic = dpname;
        }
        if (cpname != "") {
            user.coverPic = cpname;
        }
        // console.log('dp cp', olddp, oldcp, dpname , cpname, 'user to be saved', user);

        await user.save()
            .then(user => {
                console.log(`${user} updated`);

                fs.mkdirSync(`public/user_images/${user._id}/coverPic`
                ,{ recursive: true }
                
                    );

                if (cpname != "") {

                    // if (imageFile != "") {
                        if (oldcp != "") {
                            fs.unlinkSync('public/user_images/' + user._id + '/coverPic/' + oldcp
                            // , function (err) {
                            //     if (err)
                            //         console.log(err);
                            // }
                            );
                        }
                        var path = 'public/user_images/' + user._id + '/coverPic/' + cp.name;
                    cp.mv(path, function (err) {
                        return console.log(err);
                    });
                    console.log('cp moved');
                }

                fs.mkdirSync(`public/user_images/${user._id}/displayPic`
                    ,{ recursive: true }
                    // , (err) => {
                    //     if (err) {
                    //         return console.error(err);
                    //     }
                    //     console.log('dp Directory created successfully!');
                    // }
                    );
                console.log('dp Directory created successfully!');
                    
                if (dpname != "") {

                    if (olddp != "") {
                        fs.unlinkSync('public/user_images/' + user._id + '/displayPic/' + olddp
                        // , function (err) {
                        //     if (err)
                        //         console.log(err);
                        // }
                        );
                    }
                    var path = 'public/user_images/' + user._id + '/displayPic/' + dp.name;
                    dp.mv(path, function (err) {
                        return console.log(err);
                    });
                    console.log('dp moved');
                }
                console.log('going to redirect');
                res.redirect(`/profile`);
            })
            .catch(err => {
                console.log(err);
            });;

    }
    catch (error) {
        console.log(error);
    }}
    catch(error){console.log(error);}}

});




app.get('/fileComplaint', async (req, res) => {
    var { isLogined = false } = req.cookies;
    // req.session.isLogined=false;
    // console.log(req.session.isLogined);
    if( isLogined !== 'true'){
        res.redirect('/');
        
    }
    else{
        var userId=req.cookies.userId;
        try{
            var user= await users.findById(userId).exec();
        
    var cssFiles = ['style.css.css', 'leftStage.css', 'centerStage.css', 'rightStage.css', 'fileComplaint.css'];
    res.render('fileComplaint.ejs', { user, cssFiles });
        }
        catch(error){console.log(error);}}
});



app.get('/complaint/:cid', async (req, res) => {
    var { isLogined = false } = req.cookies;
    if( isLogined !== 'true'){
        res.redirect('/');
    }
    else{
        var userId=req.cookies.userId;
        try{
            var user= await users.findById(userId).exec();
        
    var cssFiles = ['style.css.css', 'leftStage.css', 'centerStage.css', 'rightStage.css', 'complaint.css'];
    var qw = req.params;
    try {
        var complaint = await complaints.findById(qw.cid).exec();
        console.log(complaint);
        res.render('complaint.ejs', { user, complaint, cssFiles });
    }
    catch (error) {
        console.log('error', error);
    }
}
catch(error){console.log( error);}}
});




app.post('/complaint', async (req, res) => {
    var reqbody=req.body;
    console.log(reqbody.name),
    res.render('root.ejs');
});


app.post('/posting', async (req, res) => {
    var { isLogined = false } = req.cookies;
    if( isLogined !== 'true'){
        res.redirect('/');
    }
    else{
        var userId=req.cookies.userId;
        try{
            var user= await users.findById(userId).exec();
        
    var pImage = req.files.files;
    // console.log(typeof pImage);
    // console.log(pImage);

    // console.log(pImage.length);
    var accusedList = req.body.accused.split(",");
    imgNames = [];
    if (pImage.length == undefined) {
        pImage = [pImage];
    }
    pImage.forEach(function (pimage) {
        imgNames.push(pimage.name);
    });
    console.log(req.body.description);
    var complaint = new complaints({
        authorId: user._id,
        authorName: user.name,
        authorEmail: req.body.authorEmail,
        authorPhone: req.body.authorPhoneNo,
        department: req.body.department,
        date: req.body.date, 
        files: imgNames,
        accused: accusedList,
        description: req.body.description,
        status: 'pending'
    });

    // prodect.save();
    complaint.save(function (err) {
        if (err)
            return console.log(err);
        // console.log(complaint);

        fs.mkdir(`public/complaint_images/${complaint._id}`,
            { recursive: true }, (err) => {
                if (err) {
                    return console.error(err);
                }
                console.log('Directory created successfully!');
            });


        pImage.forEach(function (pimage) {
            var imageFile = pimage.name;
            if (imageFile != "") {
                var path = 'public/complaint_images/' + complaint._id + '/' + imageFile;
                pimage.mv(path, function (err) {
                    return console.log(err);
                });
            }
        });
        res.redirect('/home');

    });

}
catch(error){console.log(error);}}
});




app.get('/logout', (req, res) => {
    res.cookie('isLogined',false);
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`listening on port ${port}`);
});