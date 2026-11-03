package com.example.demo.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import com.example.demo.models.FotoImovelModel;

public interface  FotoImovelRepository extends JpaRepository<FotoImovelModel, Integer>{
    List<FotoImovelModel> findByImovelId(Integer imovelId);
    
}
