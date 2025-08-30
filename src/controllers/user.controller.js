import {asynchandler} from "../utils/asynchandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
const generateAccessAndRefereshToken = async (userId) =>{
   
      try{
   const user = await User.findById(userId)
   const accessToken= user.generateAccessToken()
   const refreshToken= user.generateRefreshToken()

   user.refreshToken = refreshToken
   await user.save({validateBeforeSave : false})
      
   return {accessToken , refreshToken}
      } catch(error){
throw new ApiError(500 , "something went wrongwhile generating referesh and access token  ")
      }

}
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
//  other options 
 if( 
    [fullname,email , username ,password].some((field)=> field?.trim()==="") ){
        throw new ApiError(400 , "All field are required" )
    }

const existedUser= await User.findOne({
    $or:[{username},{email}]
 })
console.log(existedUser)

  if( existedUser){
    throw new ApiError(409 , "User with email or username already exists")
  }

  const avatarlocalpath=req.files?.avatar[0]?.path;
  const coverImagelocalpath=req.files?.coverImage[0]?.path;

//console.log("avatarlocalpath: ",avatarlocalpath.files)
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
// console.log("createUser",createUser)
 if(!createUser){
  throw new ApiError(500 , "Something wents wrong while registering the user")
 }

 return res.status(201).json(
  new ApiResponse(200,createUser,"user register successfully ")
 )
})

const loginUser = asynchandler(async(req , res)=> {
  //req body ->data
  //username or email 
  //find the user
  // password check
  //acess and referesh token give to user
  //serd cookie to user
  const {email , username , password } = req.body
  if (!(email || username)){
    throw new ApiError(400 , "username or email is required")
  }
  const user = await User.findOne({
    $or: [{username} , {email}]
  })
  if(!user){
    throw new ApiError(404)
  }
 const isPasswordValid=  await user.isPasswordCorrect(password)
  
 if(!isPasswordValid){
  throw new ApiError(401 , "Invalid user credentials")
 }

 const {accessToken, refreshToken}= await generateAccessAndRefereshToken(user._id)

 const loggedInUser = await User.findById(user._id).
 select("-password -refreshToken")

 const options = { 
  httpOnly : true,
  secure: true
 }
  return res
  .status(200)
  .cookie("accessToken" , accessToken , options)
  .cookie( "refreshToken" , refreshToken,options)
  .json(
    new ApiResponse(
      200,
      {
        user:loggedInUser , accessToken,
        refreshToken
      },
      "User logged in successfully"
    )
  )
  
 
})
  const logoutUser = asynchandler( async (req , res) =>{
  await User.findOneAndReplace(
    req.user._id,
    {
      $set:{
        refreshToken:undefined
      }
      
    },{
        new : true
      }
  )

  const options = { 
  httpOnly : true,
  secure: true
   }
   return res
   .status(200)
   .clearCookie("accessToken" ,options)
   .clearCookie("rrefreshToken",options)
   .json(new ApiResponse(200, {},"User logged Out"))
  }) 

  const refreshAccessToken = asynchandler(async ( req , res)=>{
    const incommingRefreshToken = req.cookies.
    refreshToken|| req.body.refreshToken
    // req.body.refreshToken it is for mobile se token ke liye 
    if (!incommingRefreshToken){
      throw new ApiError(401,"unauthorized request")

    }


    try {
      const decodedtoken= jwt.verify(incommingRefreshToken , 
        process.env.REFRESH_TOKEN_SECRET
      )
  
      const user = await User.findById(decodedtoken?._id)
   
      if(!user){
        throw new ApiError(401 , "Invalid refreshtoken")
      }
  
      if(incommingRefreshToken!==user?.refreshToken){
        throw new ApiError(401,"refresh token is expired or used")
      }
  
      const options = {
        httpOnly: true,
        secure: true
      }
      
      const {accessToken,newrefreshtoken} = generateAccessAndRefereshToken(user._id)
  
      return res
      .status(200)
      .cookie("accessToken" , accessToken,options)
      .cookie("refreshToken",newrefreshtoken,options)
      .json(
        new ApiResponse(200,
        {accessToken,refreshToken : newrefreshtoken},
        "Access token successfully"
      )
    )
    } catch (error) {
      throw new ApiError(401,error?.message || 
        "Invalid refresh token"
      )
    }
    
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken
}