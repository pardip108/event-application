
const Event = require('../models/Event');



exports.getAllEvents = async (req, res) => {
    try {

        const filter = {};
        if (req.query.category) {
            filter.category = req.query.category;
        }
        if (req.query.ticketPrice) {
            filter.ticketPrice = req.query.ticketPrice;
        }

        const events = await Event.find(filter);
        res.json(events);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        res.json(event);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.createEvent = async (req, res) => {
    try {
        const { title, description, date, location, category, totalSeats, availableSeats, ticketPrice, imageUrl } = req.body;
        const event = new Event({
            title,
            description,
            date,
            location,
            category,
            totalSeats,
            availableSeats,
            ticketPrice,
            imageUrl,
            createdBy: req.user._id
        });
        await event.save();
        res.status(201).json(event);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        const { title, description, date, location, category, totalSeats, availableSeats, ticketPrice, imageUrl } = req.body;
        event.title = title || event.title;
        event.description = description || event.description;
        event.date = date || event.date;
        event.location = location || event.location;
        event.category = category || event.category;
        event.totalSeats = totalSeats || event.totalSeats;
        event.availableSeats = availableSeats || event.availableSeats;
        event.ticketPrice = ticketPrice || event.ticketPrice;
        event.imageUrl = imageUrl || event.imageUrl;

        await event.save();
        res.json(event);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        await event.remove();
        res.json({ message: "Event deleted" });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}   

