SET FOREIGN_KEY_CHECKS=0;
SET sql_require_primary_key=0;

-- Core tables
CREATE TABLE IF NOT EXISTS `climate_category` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `category_name` varchar(50) NOT NULL,
  `min_temp` decimal(5,2) DEFAULT NULL,
  `max_temp` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `location` (
  `location_id` int NOT NULL AUTO_INCREMENT,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) NOT NULL,
  `country` varchar(100) NOT NULL,
  `latitude` decimal(8,5) DEFAULT NULL,
  `longitude` decimal(8,5) DEFAULT NULL,
  PRIMARY KEY (`location_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `weather_station` (
  `station_id` int NOT NULL AUTO_INCREMENT,
  `station_name` varchar(100) NOT NULL,
  `installation_date` date DEFAULT NULL,
  `location_id` int NOT NULL,
  PRIMARY KEY (`station_id`),
  KEY `location_id` (`location_id`),
  CONSTRAINT `weather_station_ibfk_1` FOREIGN KEY (`location_id`) REFERENCES `location` (`location_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `weather_data` (
  `data_id` int NOT NULL AUTO_INCREMENT,
  `station_id` int NOT NULL,
  `category_id` int NOT NULL,
  `record_date` date NOT NULL,
  `temperature` decimal(5,2) DEFAULT NULL,
  `humidity` decimal(5,2) DEFAULT NULL,
  `rainfall` decimal(6,2) DEFAULT NULL,
  `wind_speed` decimal(5,2) DEFAULT NULL,
  `pressure` decimal(6,2) DEFAULT NULL,
  PRIMARY KEY (`data_id`),
  KEY `station_id` (`station_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `weather_data_ibfk_1` FOREIGN KEY (`station_id`) REFERENCES `weather_station` (`station_id`),
  CONSTRAINT `weather_data_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `climate_category` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `weather_alert` (
  `alert_id` int NOT NULL AUTO_INCREMENT,
  `data_id` int NOT NULL,
  `alert_type` varchar(100) NOT NULL,
  `description` text,
  PRIMARY KEY (`alert_id`),
  KEY `data_id` (`data_id`),
  CONSTRAINT `weather_alert_ibfk_1` FOREIGN KEY (`data_id`) REFERENCES `weather_data` (`data_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Data
INSERT IGNORE INTO `climate_category` VALUES (1,'Cold',0.00,15.00),(2,'Moderate',15.01,30.00),(3,'Hot',30.01,50.00);

INSERT IGNORE INTO `location` VALUES
  (1,'Chennai','Tamil Nadu','India',13.08268,80.27072),
  (2,'Mumbai','Maharashtra','India',19.07283,72.88261),
  (3,'Delhi','Delhi','India',28.65195,77.23149);

INSERT IGNORE INTO `weather_station` VALUES
  (1,'Chennai Central Station','2020-01-01',1),
  (2,'Mumbai Coastal Station','2019-06-15',2),
  (3,'Delhi North Station','2021-03-10',3);

INSERT IGNORE INTO `weather_data` (station_id, category_id, record_date, temperature, humidity, rainfall, wind_speed, pressure) VALUES
  (1, 3, '2026-01-10', 35.50, 78.00, 0.00, 3.20, 1010.50),
  (2, 2, '2026-01-10', 28.00, 85.00, 5.00, 4.10, 1008.20),
  (3, 1, '2026-01-10', 12.00, 55.00, 0.00, 2.80, 1015.00);

SET FOREIGN_KEY_CHECKS=1;

-- Extra Features for DBMS Project
CREATE TABLE IF NOT EXISTS `weather_audit` (
  `audit_id` int NOT NULL AUTO_INCREMENT,
  `data_id` int DEFAULT NULL,
  `action_type` varchar(20) NOT NULL,
  `action_timestamp` timestamp DEFAULT CURRENT_TIMESTAMP,
  `old_temp` decimal(5,2) DEFAULT NULL,
  `new_temp` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`audit_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE OR REPLACE VIEW `city_climate_trends` AS
SELECT 
    l.city,
    COUNT(d.data_id) as total_records,
    ROUND(AVG(d.temperature), 2) as avg_temp,
    ROUND(MAX(d.temperature), 2) as max_temp,
    ROUND(MIN(d.temperature), 2) as min_temp,
    ROUND(AVG(d.humidity), 2) as avg_humidity,
    ROUND(SUM(d.rainfall), 2) as total_rainfall
FROM weather_data d
JOIN weather_station s ON d.station_id = s.station_id
JOIN location l ON s.location_id = l.location_id
GROUP BY l.city;

-- Note: Trigger creation might require special privileges on some cloud providers.
-- If this fails on Aiven, ensure 'log_bin_trust_function_creators' is enabled.
DROP TRIGGER IF EXISTS `after_weather_insert`;
DELIMITER //
CREATE TRIGGER `after_weather_insert` 
AFTER INSERT ON `weather_data`
FOR EACH ROW 
BEGIN
    INSERT INTO weather_audit (data_id, action_type, new_temp) 
    VALUES (NEW.data_id, 'INSERT', NEW.temperature);
END//
DELIMITER ;
