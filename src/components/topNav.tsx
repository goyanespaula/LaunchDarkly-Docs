/** @jsx jsx */
import { jsx, useThemeUI } from 'theme-ui'
import { Link as ExternalLink } from '@theme-ui/components'
import { graphql, useStaticQuery, Link as GatsbyLink } from 'gatsby'
import { SideNavItem } from './sideNav/types'
import isExternalLink from '../utils/isExternalLink'

const TopNav = () => {
  const { theme } = useThemeUI()
  const {
    allNavigationDataJson: { nodes: navigationData },
  } = useStaticQuery(graphql`
    query {
      allNavigationDataJson {
        nodes {
          label
          path
        }
      }
    }
  `)

  return (
    <ul
      sx={{
        fontSize: [null, 3],
        fontWeight: 'bold',
        display: ['none', 'flex'],
        justifyContent: 'space-between',
        width: [null, 'auto', 'auto'],
        whiteSpace: 'nowrap',
      }}
    >
      {navigationData.map((rootItem: SideNavItem, index: number) => {
        const { label, path } = rootItem
        const capitalizedLabel = label.toUpperCase()
        const variant = 'links.topNav'

        return (
          <li key={`${label}-${index}`} sx={{ display: 'inline', pr: [null, 5, 6] }}>
            {isExternalLink(path) ? (
              <ExternalLink href={path} target="_blank" variant={variant}>
                {capitalizedLabel}
              </ExternalLink>
            ) : (
              <GatsbyLink
                to={path}
                partiallyActive={true}
                activeStyle={{ color: theme.colors.primaryBase }}
                sx={{ variant }}
              >
                {capitalizedLabel}
              </GatsbyLink>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default TopNav