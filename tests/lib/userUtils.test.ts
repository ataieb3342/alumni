import { describe, it, expect } from 'vitest'
import { getMostRecentActivity } from '@/lib/userUtils'

describe('getMostRecentActivity', () => {
  describe('with current experience', () => {
    it('returns current experience when it exists', () => {
      const user = {
        experience: [
          {
            company: 'Old Company',
            position: 'Old Position',
            location: 'Old City',
            startDate: '2020-01-01',
            endDate: '2022-01-01',
            current: false,
          },
          {
            company: 'Current Company',
            position: 'Software Engineer',
            location: 'Paris',
            startDate: '2022-01-01',
            current: true,
          },
        ],
      }

      const result = getMostRecentActivity(user)

      expect(result).toEqual({
        currentJob: 'Software Engineer',
        company: 'Current Company',
        currentCity: 'Paris',
        isEducation: false,
      })
    })

    it('prioritizes current experience over recent education', () => {
      const user = {
        experience: [
          {
            company: 'Current Company',
            position: 'Developer',
            location: 'Lyon',
            startDate: '2020-01-01',
            current: true,
          },
        ],
        education: [
          {
            school: 'University',
            degree: 'Master',
            field: 'Computer Science',
            startYear: 2023,
            endYear: 2024,
          },
        ],
      }

      const result = getMostRecentActivity(user)

      expect(result).toEqual({
        currentJob: 'Developer',
        company: 'Current Company',
        currentCity: 'Lyon',
        isEducation: false,
      })
    })
  })

  describe('without current experience', () => {
    it('returns most recent education when only education exists', () => {
      const user = {
        education: [
          {
            school: 'Old School',
            degree: 'Bachelor',
            field: 'Engineering',
            startYear: 2015,
            endYear: 2018,
          },
          {
            school: 'Recent University',
            degree: 'Master',
            field: 'Computer Science',
            startYear: 2018,
            endYear: 2020,
          },
        ],
      }

      const result = getMostRecentActivity(user)

      expect(result).toEqual({
        currentJob: 'Master',
        company: 'Recent University',
        currentCity: 'Computer Science',
        isEducation: true,
      })
    })

    it('returns most recent experience when only experience exists', () => {
      const user = {
        experience: [
          {
            company: 'Old Company',
            position: 'Junior Dev',
            location: 'Marseille',
            startDate: '2018-01-01',
            endDate: '2020-01-01',
          },
          {
            company: 'Recent Company',
            position: 'Senior Dev',
            location: 'Paris',
            startDate: '2020-01-01',
            endDate: '2023-01-01',
          },
        ],
      }

      const result = getMostRecentActivity(user)

      expect(result).toEqual({
        currentJob: 'Senior Dev',
        company: 'Recent Company',
        currentCity: 'Paris',
        isEducation: false,
      })
    })

    it('compares education and experience dates, returns most recent', () => {
      const user = {
        education: [
          {
            school: 'University',
            degree: 'Master',
            field: 'CS',
            startYear: 2020,
            endYear: 2022,
          },
        ],
        experience: [
          {
            company: 'Company',
            position: 'Developer',
            location: 'Paris',
            startDate: '2018-01-01',
            endDate: '2020-01-01',
          },
        ],
      }

      const result = getMostRecentActivity(user)

      expect(result).toEqual({
        currentJob: 'Master',
        company: 'University',
        currentCity: 'CS',
        isEducation: true,
      })
    })

    it('returns experience when it is more recent than education', () => {
      const user = {
        education: [
          {
            school: 'University',
            degree: 'Bachelor',
            field: 'CS',
            startYear: 2015,
            endYear: 2018,
          },
        ],
        experience: [
          {
            company: 'Recent Company',
            position: 'Developer',
            location: 'Lyon',
            startDate: '2020-01-01',
            endDate: '2023-01-01',
          },
        ],
      }

      const result = getMostRecentActivity(user)

      expect(result).toEqual({
        currentJob: 'Developer',
        company: 'Recent Company',
        currentCity: 'Lyon',
        isEducation: false,
      })
    })
  })

  describe('edge cases', () => {
    it('handles user with no experience or education', () => {
      const user = {}

      const result = getMostRecentActivity(user)

      expect(result).toEqual({
        isEducation: false,
      })
    })

    it('handles user with empty arrays', () => {
      const user = {
        experience: [],
        education: [],
      }

      const result = getMostRecentActivity(user)

      expect(result).toEqual({
        isEducation: false,
      })
    })

    it('handles education without endYear (ongoing)', () => {
      const user = {
        education: [
          {
            school: 'Current University',
            degree: 'PhD',
            field: 'AI',
            startYear: 2023,
          },
        ],
      }

      const result = getMostRecentActivity(user)

      expect(result).toEqual({
        currentJob: 'PhD',
        company: 'Current University',
        currentCity: 'AI',
        isEducation: true,
      })
    })

    it('handles experience without endDate (uses startDate)', () => {
      const user = {
        experience: [
          {
            company: 'Company',
            position: 'Developer',
            location: 'Paris',
            startDate: '2023-01-01',
          },
        ],
      }

      const result = getMostRecentActivity(user)

      expect(result).toEqual({
        currentJob: 'Developer',
        company: 'Company',
        currentCity: 'Paris',
        isEducation: false,
      })
    })

    it('sorts education by endYear then startYear', () => {
      const user = {
        education: [
          {
            school: 'School A',
            degree: 'Degree A',
            field: 'Field A',
            startYear: 2018,
            endYear: 2020,
          },
          {
            school: 'School B',
            degree: 'Degree B',
            field: 'Field B',
            startYear: 2020,
            endYear: 2020,
          },
        ],
      }

      const result = getMostRecentActivity(user)

      expect(result.company).toBe('School B')
    })

    it('handles experience without location', () => {
      const user = {
        experience: [
          {
            company: 'Remote Company',
            position: 'Remote Developer',
            startDate: '2023-01-01',
            current: true,
          },
        ],
      }

      const result = getMostRecentActivity(user)

      expect(result).toEqual({
        currentJob: 'Remote Developer',
        company: 'Remote Company',
        currentCity: undefined,
        isEducation: false,
      })
    })

    it('handles education with same endYear, sorts by startYear', () => {
      const user = {
        education: [
          {
            school: 'School A',
            degree: 'Degree A',
            field: 'Field A',
            startYear: 2015,
            endYear: 2020,
          },
          {
            school: 'School B',
            degree: 'Degree B',
            field: 'Field B',
            startYear: 2018,
            endYear: 2020,
          },
        ],
      }

      const result = getMostRecentActivity(user)

      // Should return School B because it has a more recent startYear
      expect(result.company).toBe('School B')
      expect(result.isEducation).toBe(true)
    })

    it('handles education without startYear', () => {
      const user = {
        education: [
          {
            school: 'School',
            degree: 'Degree',
            field: 'Field',
            startYear: 0,
            endYear: 2020,
          },
        ],
      }

      const result = getMostRecentActivity(user)

      expect(result).toEqual({
        currentJob: 'Degree',
        company: 'School',
        currentCity: 'Field',
        isEducation: true,
      })
    })
  })
})
