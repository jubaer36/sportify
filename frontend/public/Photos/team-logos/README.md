# Team Logos

This folder contains logo options for team creation.

## Current Logo Files
- logo1.png - Classic Shield
- logo2.png - Modern Emblem  
- logo3.png - Athletic Badge
- logo4.png - Champion Crest
- logo5.png - Victory Wing (Basketball themed)
- logo6.png - Power Symbol (Football themed)
- logo7.png - Elite Mark (Cricket themed)
- logo8.png - Thunder Bolt (Volleyball themed)

## Adding New Logos
To add new team logo options:

1. Add your logo image files to this folder
2. Update the `availableLogos` array in `/frontend/app/player/create-teams/[id]/page.tsx`
3. Logos should be:
   - Square format (preferably 200x200px or larger)
   - PNG format for transparency support
   - Clear and readable at small sizes
   - Appropriate for sports teams

## Usage
Players can select from these logos when creating a new team. The selected logo path is stored in the database with the team record.

## Database Storage
Logo paths are stored in the `teams` table in the `logo` column as strings, e.g., `/Photos/team-logos/logo1.png`