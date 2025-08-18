import {asynchandler} from "../utils/asynchandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
const registerUser = asynchandler( async (req, res) =>{
    //algorithm 
    //get user detail from frontend
    //validation -not empty
    //check if user already exist : username,email
    //upload them to cloudinary ,avatar 
    // create user object -create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return res

  const { fullname ,email , username , password}=req.body
   console.log("email :", email);
    
//    if(fullname===""){
//     throw new ApiError(400, "something wents wrong")
//    }
 //other options 
 if( 
    [fullname,email , username ,password].some((field)=> field?.trim()==="") ){
        throw new ApiError(400 , "All field are required" )
    }

const existedUser= User.findOne({
    $or:[{username},{email}]
 })

  if( existedUser){
    throw new ApiError(409 , "User with email or username already exists")
  }

  const avatarlocalpath=req.files?.avatar[0]?.path;
  const coverImagelocalpath=req.files?.converImage[0]?.path;

  if( !avatarlocalpath){
    throw new ApiError(400,"Avatar file is requires")
  }
  const avatar = await uploadOnCloudinary(avatarlocalpath);
  const coverImage = await uploadOnCloudinary(coverImagelocalpath);

  if( !avatar){
    throw new ApiError(400 , "Avatar file is required")
  }

const user = await  User.create({
    fullname, 
    avatar : avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username:username.toLowerCase()
  })
 const createUser=  await User.findById(user._id).select(
  " -password -refreshToken"
 )
 if(!createUser){
  throw new ApiError(500 , "Something wents wrong while registering the user")
 }

 return res.status(201).json(
  new ApiResponse(200,createUser,"user register successfully ")
 )
})

export {registerUser}