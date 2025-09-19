# FDFED-END Project

## Branches
- **main** → Stable branch, **do NOT commit directly**
- **dev** → Development branch, merge all feature branches here first
- **feature/<name>** → Branch for your specific feature

---

## Setup Instructions

Clone the repository:  
git clone https://github.com/likhit2804/FDFED-END.git  
cd FDFED-END

Switch to `dev` branch and pull latest changes:  
git checkout dev  
git pull origin dev

Create your feature branch:  
git checkout -b feature/<your-feature>

---

## Working on Your Feature

Add and commit changes:  
git add .  
git commit -m "Implement <feature>"

Push your feature branch to remote:  
git push origin feature/<your-feature>

---

## Merge Feature to Dev

Switch to `dev` and pull latest:  
git checkout dev  
git pull origin dev

Merge your feature branch:  
git merge feature/<your-feature>  
git push origin dev

---

## Notes

- Never commit directly to **main**
- Keep **dev** clean; merge features only via PR
- Communicate with teammates for code reviews
- Use descriptive commit messages

---

