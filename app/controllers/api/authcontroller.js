const {success, error, validation } = require('../../helpers/responseApi');
require('../../helpers/common');
const { validationResult } = require('express-validator');
const { randomString } = require("../../helpers/common");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/user');
const config = require("config");
const Client = require('../../models/client');
const GP = require('../../models/GP');
const Verification = require("../../models/verificationModel");

exports.register = async(req, res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty())
      return res.status(422).json(validation(errors.array()));
  const { prenom, nom, email, telephone, role, password, new_password } = req.body;
  try {
      if (!prenom || !nom || !email || !role || ! telephone || !password || !new_password)
          return res.status(422).json(validation({message:"Tous les champs sont requis pour creer un compte "}));

      let existUser = await User.findOne({email: email});
      if (existUser)
          return res.status(422).json(validation({message:"Cet Utilisateur existe deja, Veuillez vous connecter"}));

      if (password != new_password) 
          return res.status(422).json(validation({message:"Les mots de passe ne correspondent pas !"}));

      let newUser = new User({
              prenom,
              nom,
              email,
              adresse,
              telephone,
              role,
              password,
              new_password
          });
      const hash = await bcrypt.genSalt(10);
      newUser.password = await bcrypt.hash(password, hash);
      newUser.new_password = await bcrypt.hash(new_password, hash);
      await newUser.save();

      if (role == 'client'){
          newUser = new Client({
              user: newUser._id
          });
          await newUser.save();
      }
      else if (role == 'GP') {
          newUser = new GP({
              user: newUser._id,
          });
          await newUser.save();
      }


      res.status(200).json(
          success(
              "Inscription Reussie, Veuillez vous connecter !",
              {
                  User : {
                      id: newUser._id,
                      prenom : newUser.prenom,
                      nom : newUser.nom,
                      genre : newUser.genre,
                      adresse : newUser.adresse,
                      telephone : newUser.telephone,
                      role: newUser.role,
                      email: newUser.email,
                      createdAt: newUser.createdAt,
                  },
              },
              res.statusCode
          )
      )
  } catch (err) {
      console.error(err.message);
      res.status(500).json(error("Erreur interne serveur", res.statusCode));
  }
};



exports.verify = async (req, res) => {
    const { token } = req.params;
  
    try {
      let verification = await Verification.findOne({
        token,
        type: "Creating New Account",
      });
  
      if (!verification)
        return res
          .status(404)
          .json(error("Compte non verifié", res.statusCode));
  
      let user = await User.findOne({ _id: verification.userId }).select(
        "-password"
      );
      user = await User.findByIdAndUpdate(user._id, {
        $set: {
          verified: true,
          verifiedAt: new Date(),
        },
      });
  
      verification = await Verification.findByIdAndRemove(verification._id);
  
      res
        .status(200)
        .json(
          success(
            "Verification réussie !",
            null,
            res.statusCode
          )
        );
    } catch (err) {
      console.log(err);
      res.status(500).json(error("Erreur interne serveur", res.statusCode));
    }
  };



  exports.login = async(req,res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty())
      return res.status(422).json(validation(errors.array()));
  
    const { email, password } = req.body;
  
    try {
      const user = await User.findOne({ email });
  
      
      if (!user) return res.status(422).json(validation("Email inexistant veuillez vous inscrire !"));
  
      let checkPassword = await bcrypt.compare(password, user.password);
      if (!checkPassword)
        return res.status(422).json(validation("Mot de passe incorrect !"));
  
      // if (user && !user.verified)
      //   return res
      //     .status(400)
      //     .json(error("Votre compte n'est pas encore activé", res.statusCode));
  
      const payload = {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
      };
  
      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: 3600 },
        (err, token) => { 
          if (err) throw err;
          res
            .status(200)
            .json(success("Connexion Réussie", { user,token }, res.statusCode));
        }
      );
    } catch (err) {
      console.log(err.message);
      res.status(500).json(error("Erreur serveur interne !", res.statusCode));
    }
  };
  exports.resendVerification = async(req, res) => {
    const { email } = req.body;

  if (!email)
    return res.status(422).json(validation([{ msg: "Veuillez entrez votre email svp !" }]));

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user)
      return res.status(404).json(error("Email inexistant, inscrivez vous svp !", res.statusCode));

    let verification = await Verification.findOne({
      userId: user._id,
      type: "Creating New Account",
    });

 
    if (verification) {
      verification = await Verification.findByIdAndRemove(verification._id);
    }

    let newVerification = new Verification({
      token: randomString(50),
      userId: user._id,
      type: "Creating New Account",
    });

    await newVerification.save();

    res
      .status(201)
      .json(
        success(
          "La vérification a bien été envoyée !",
          { verification: newVerification },
          res.statusCode
        )
      );
  } catch (err) {
    console.error(err.message);
    res.status(500).json(error("Erreur interne serveur", res.statusCode));
  }
  };

  exports.getAuthenticatedUser = async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select("-password");
  
      if (!user)
        return res.status(404).json(error("Pas d'utilisateur trouvé", res.statusCode));
  
      res
        .status(200)
        .json(success(`Salut ${user.prenom + " "+ user.nom}`, { user }, res.statusCode));
    } catch (err) {
      console.error(err.message);
      res.status(500).json(error("Erreur serveur interne", res.statusCode));
    }
  };
