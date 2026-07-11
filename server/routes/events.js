
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { getAllEvents, getEventById, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');


// get all events
router.get('/', getAllEvents);

//get event by id
router.get('/:id', getEventById);

// create new event
router.post('/', protect, admin, createEvent);

// update event by id
router.put('/:id', protect, admin, updateEvent);

// delete event by id
router.delete('/:id', protect, admin, deleteEvent);

module.exports = router;