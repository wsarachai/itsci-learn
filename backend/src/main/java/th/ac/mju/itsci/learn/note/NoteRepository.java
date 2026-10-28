package th.ac.mju.itsci.learn.note;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoteRepository extends JpaRepository<Note, Long> {

	List<Note> findAllByOrderByIdDesc();

}
