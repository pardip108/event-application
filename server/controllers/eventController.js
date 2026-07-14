
const Event = require('../models/Event');



exports.getAllEvents = async (req, res) => {
    try {

        const filter = {};
        if (req.query.category) {
            filter.category = req.query.category;
        }
        if (req.query.search) {
            filter.title = { $regex: req.query.search, $options: 'i' };
        }

        const events = await Event.find(filter).populate('createdBy', 'name email');
        res.json(events);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('createdBy', 'name email');
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        res.json(event);
    }
    catch (error) {
        res.status(500).json({message: "Server error: " , error: error.message });
    }
}

exports.createEvent = async (req, res) => {
    try {
        const { title, description, date, location, category, totalSeats, ticketPrice, imageUrl } = req.body;
        const event = new Event({
            title,
            description,
            date,
            location,
            category,
            totalSeats,
            availableSeats: totalSeats, // Initially, available seats are equal to total seats
            ticketPrice: ticketPrice || 0, // Default ticket price to 0 if not provided
            imageUrl: imageUrl || '', // Default image URL to empty string if not provided  
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
        const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        res.json(event);
    }
    catch (error) {
        res.status(500).json({message: "Server error: " , error: error.message });
    }
}


exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        res.json({ message: "Event deleted" });
    }
    catch (error) {
        res.status(500).json({message: "Server error: " , error: error.message });
    }
}   

