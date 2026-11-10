package com.example.demo.repositories;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.example.demo.models.FavoritoModel;

public interface FavoritoRepository extends JpaRepository<FavoritoModel, Integer> {
    List<FavoritoModel> findByUsuarioIdOrderByIdDesc(Integer usuarioId);
    boolean existsByUsuarioIdAndImovelId(Integer usuarioId, Integer imovelId);
    long deleteByUsuarioIdAndImovelId(Integer usuarioId, Integer imovelId);
    long deleteByUsuarioId(Integer usuarioId);
    long deleteByImovelId(Integer imovelId);
}
