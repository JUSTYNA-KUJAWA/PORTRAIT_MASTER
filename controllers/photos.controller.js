const Photo = require('../models/photo.model');
const Voter = require('../models/Voter.model');
const sanitize = require('mongo-sanitize');
const requestIp = require('request-ip');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if (title && author && email && file) {
       // if fields are not empty...

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split('.').slice(-1)[0];
      if (fileExt === 'gif' || fileExt === 'png' || fileExt === 'jpg') {
        const newPhoto = new Photo({
          title: sanitize(title),
          author: sanitize(author),
          email: sanitize(email),
          src: fileName,
          email,
          votes: 0,
        });
        await newPhoto.save(); // ...save new photo in DB
        res.json(newPhoto);
      } else {
        throw new Error('Wrong file!');
      }
    } else {
      throw new Error('Wrong input!');
    }

  } catch(err) {

    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const clientIp = requestIp.getClientIp(req);
    const findUser = await Voter.findOne({ users: clientIp });
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });

    if (!findUser) {
      const newVoter = new Voter({
        users: clientIp,
        $push: { votes: photoToUpdate._id },
      });
      await newVoter.save();
    } else {
      const findVote = findUser.votes.includes(photoToUpdate._id);
      if (findVote) {
        res.status(500).json({ message: 'You have already voted' });
      } else {
        await Voter.findOneAndUpdate(
          { users: clientIp },
          { $push: { votes: photoToUpdate._id } },
          (err, doc) => {
            photoToUpdate.votes++;
            photoToUpdate.save();
            res.send({ message: 'OK' });
          }
        );
      }
    }
    if(!photoToUpdate) res.status(404).json({ message: 'Not found' });
  } catch(err) {
    res.status(500).json(err);
  }

};
