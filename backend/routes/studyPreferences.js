const express = require('express');
const router = express.Router();
const studyPreferencesService = require('../services/studyPreferencesService');

router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const preferences = await studyPreferencesService.getStudyPreferences(userId);

    if (!preferences) {
      return res.status(404).json({ message: 'Study preferences not found' });
    }

    const parsedPreferences = {
      ...preferences,
      preferredDays: JSON.parse(preferences.preferredDays),
      preferredTimeRanges: JSON.parse(preferences.preferredTimeRanges)
    };

    res.json(parsedPreferences);
  } catch (error) {
    next(error);
  }
});


router.get('/:userId1/compatible-times/:userId2', async (req, res, next) => {
  try {
    const { userId1, userId2 } = req.params;
    const compatibleTimes = await studyPreferencesService.getCompatibleStudyTimes(userId1, userId2);
    res.json(compatibleTimes);
  } catch (error) {
    next(error);
  }
});

router.post('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const preferencesData = req.body;

    const updatedPreferences = await studyPreferencesService.createOrUpdateStudyPreferences(
      userId,
      preferencesData
    );

    const parsedPreferences = {
      ...updatedPreferences,
      preferredDays: JSON.parse(updatedPreferences.preferredDays),
      preferredTimeRanges: JSON.parse(updatedPreferences.preferredTimeRanges)
    };

    res.json(parsedPreferences);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
