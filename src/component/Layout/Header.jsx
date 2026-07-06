import React from 'react';
import { Search, Bell } from 'lucide-react';
import styles from './Header.module.css';

const Header = ({ breadcrumbs }) => {
  const username = localStorage.getItem('username') || 'Alex';

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <span className={styles.breadcrumbs}>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              <span className={index === breadcrumbs.length - 1 ? styles.activeCrumb : styles.crumb}>
                {crumb}
              </span>
              {index < breadcrumbs.length - 1 && <span className={styles.separator}>{'>'}</span>}
            </React.Fragment>
          ))}
        </span>
      </div>

      <div className={styles.right}>
        <div className={styles.searchContainer}>
          <Search size={18} className={styles.searchIcon} />
          <input type="text" placeholder="Quick search..." className={styles.searchInput} />
        </div>

        <button className={styles.notificationBtn}>
          <Bell size={20} />
          <span className={styles.badge}></span>
        </button>

        <div className={styles.userProfile}>
          <div className={styles.avatar}>
            {username.substring(0, 2).toUpperCase()}
          </div>
          <span className={styles.userName}>{username}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
