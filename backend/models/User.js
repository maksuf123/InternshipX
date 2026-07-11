const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
    name:{
        type:String,
        required:true
    },

    email:{
        type:String,
        required:true,
        unique:true
    },

    password:{
        type:String,
        required:true
    },

    role:{
        type:String,
        enum:["student","company","admin"],
        default:"student"
    },

    isVerified:{
        type:Boolean,
        default:false
    },

    otp:{
        type:String,
        default:null
    },

    otpExpiry:{
        type:Date,
        default:null
    },

    pendingEmail:{
        type:String,
        default:null
    },

    emailChangeOtp:{
        type:String,
        default:null
    },

    emailChangeOtpExpiry:{
        type:Date,
        default:null
    },

    profileImage:{
        type:String,
        default:""
    }

},
{
    timestamps:true
}
);

module.exports = mongoose.model("User",userSchema);
