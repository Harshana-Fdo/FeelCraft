-- Keep the source ID as historical provenance. MariaDB can reject overlapping
-- user-to-design and user-to-publication cascades when the source FK sets NULL.
-- Publication creation verifies the live source and owner in the INSERT.
ALTER TABLE publications DROP FOREIGN KEY publications_ibfk_2;
